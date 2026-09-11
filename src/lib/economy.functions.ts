import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { readJsonFile, writeJsonFile } from "@/lib/dayz/store";

export type EconomyAccount = {
	playerId: string;
	displayName: string;
	balance: number;
	xp: number;
};

export type EconomyTransfer = {
	id: string;
	fromPlayerId: string;
	toPlayerId: string;
	amount: number;
	note?: string;
	createdAt: string;
};

type EconomyStore = {
	accounts: Record<string, EconomyAccount>;
	transfers: EconomyTransfer[];
};

const DEFAULT_STORE: EconomyStore = { accounts: {}, transfers: [] };

async function loadStore() {
	return readJsonFile<EconomyStore>("economy.json", DEFAULT_STORE);
}

function accountFor(store: EconomyStore, playerId: string): EconomyAccount {
	const existing = store.accounts[playerId];
	if (existing) return existing;
	const account = { playerId, displayName: playerId === "demo-user" ? "Asylum Demo" : playerId, balance: 0, xp: 0 };
	store.accounts[playerId] = account;
	return account;
}

export const getEconomyBalance = createServerFn({ method: "GET" })
	.middleware([requireSupabaseAuth])
	.inputValidator((data: { playerId?: string }) => data)
	.handler(async ({ data, context }) => {
		const store = await loadStore();
		return accountFor(store, data.playerId ?? context.userId ?? "demo-user");
	});

export const listEconomyLeaderboard = createServerFn({ method: "GET" })
	.middleware([requireSupabaseAuth])
	.handler(async () => {
		const store = await loadStore();
		return Object.values(store.accounts).sort((a, b) => b.balance - a.balance || b.xp - a.xp);
	});

export const listRecentTransfers = createServerFn({ method: "GET" })
	.middleware([requireSupabaseAuth])
	.handler(async () => (await loadStore()).transfers.slice(0, 50));

export const creditPlayer = createServerFn({ method: "POST" })
	.middleware([requireSupabaseAuth])
	.inputValidator((data: { playerId: string; amount: number; note?: string }) => data)
	.handler(async ({ data }) => {
		const store = await loadStore();
		const account = accountFor(store, data.playerId);
		account.balance += Math.floor(data.amount);
		account.xp += Math.max(0, Math.floor(data.amount / 10));
		await writeJsonFile("economy.json", store);
		return account;
	});

export const payPlayer = createServerFn({ method: "POST" })
	.middleware([requireSupabaseAuth])
	.inputValidator((data: { toPlayerId: string; amount: number; note?: string }) => data)
	.handler(async ({ data, context }) => {
		const store = await loadStore();
		const fromPlayerId = context.userId ?? "demo-user";
		const from = accountFor(store, fromPlayerId);
		const amount = Math.floor(Number(data.amount));
		if (!Number.isFinite(amount) || amount <= 0) throw new Error("Amount must be positive");
		if (from.balance < amount) throw new Error("Insufficient credits");
		from.balance -= amount;
		const to = accountFor(store, data.toPlayerId.trim());
		to.balance += amount;
		const transfer: EconomyTransfer = {
			id: `tx_${Date.now().toString(36)}`,
			fromPlayerId,
			toPlayerId: to.playerId,
			amount,
			note: data.note,
			createdAt: new Date().toISOString(),
		};
		store.transfers.unshift(transfer);
		await writeJsonFile("economy.json", store);
		return { transfer, balance: from };
	});
