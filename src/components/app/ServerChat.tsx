import { useEffect, useMemo, useState } from "react";
import { PageHexBadge } from "@/components/app/PageHexBadge";
import { IconBolt, IconCheck } from "@/components/ui-custom/CustomIcon";
import { BRAND } from "@/lib/brand";
import { toast } from "sonner";

type Channel = "global" | "faction";
type Attachment = { name: string; url: string; type: string };
type ChatMessage = { id: number; channel: Channel; body: string; attachments: Attachment[]; time: string };

const FLAGGED_TERMS = ["badword", "slur", "spamlink"];

const starterMessages: ChatMessage[] = [
  {
    id: 1,
    channel: "global",
    body: "The convoy is rolling through the north ridge. Keep your eyes open.",
    attachments: [],
    time: "09:14",
  },
  {
    id: 2,
    channel: "global",
    body: "Trader camp is live again near the old quarry. Stock up before dark.",
    attachments: [],
    time: "09:21",
  },
  {
    id: 3,
    channel: "faction",
    body: "Defense rotation updated. Watch rooftops and the north gate.",
    attachments: [],
    time: "09:27",
  },
];

export function ServerChatPage() {
  const [channel, setChannel] = useState<Channel>("global");
  const [hasFaction, setHasFaction] = useState(false);
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [moderationNotice, setModerationNotice] = useState("");

  useEffect(() => {
    setHasFaction(Boolean(window.localStorage.getItem("asylumhub:faction-profile")));
  }, []);

  const visibleMessages = useMemo(() => messages.filter((entry) => entry.channel === channel), [messages, channel]);

  const chooseFiles = (files: FileList | null) => {
    if (!files) return;
    setAttachments((current) => [
      ...current,
      ...Array.from(files).map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
      })),
    ]);
  };

  const removeAttachment = (name: string) => {
    setAttachments((current) => {
      const removed = current.find((item) => item.name === name);
      if (removed) URL.revokeObjectURL(removed.url);
      return current.filter((item) => item.name !== name);
    });
  };

  const sendMessage = () => {
    const body = message.trim();
    if (!body && attachments.length === 0) return;

    if (FLAGGED_TERMS.some((term) => body.toLowerCase().includes(term))) {
      setModerationNotice("Message held for moderator review. Remove the flagged language and try again.");
      toast.error("Message blocked");
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        channel,
        body,
        attachments,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    setMessage("");
    setAttachments([]);
    setModerationNotice("");
  };

  return (
    <div className="chat-root">
      <div className="chat-backdrop" aria-hidden>
        <div className="chat-desert" />
        <div className="chat-backdrop-glow" />
        <div className="chat-smoke chat-smoke-a" />
        <div className="chat-smoke chat-smoke-b" />
        {Array.from({ length: 88 }, (_, index) => (
          <span
            key={index}
            className="chat-ember"
            style={{
              left: `${(index * 11.5) % 100}%`,
              animationDelay: `${(index % 12) * -0.45}s`,
              animationDuration: `${2.2 + (index % 6) * 1.1}s`,
              width: `${2 + (index % 3)}px`,
              height: `${2 + (index % 4)}px`,
            }}
          />
        ))}
      </div>

      <header className="chat-header">
        <div className="chat-heading">
          <PageHexBadge hue={38} size={30} icon={<IconBolt size={22} />} aria-label="Server Chat" />
          <div>
            <div className="chat-kicker">{BRAND.name} // drylands comms</div>
            <h1>SERVER CHAT.</h1>
            <p>Keep your faction synced, your warnings loud, and the next raid moving.</p>
          </div>
        </div>

        <div className="chat-live">
          <span /> LIVE <b>•</b> {visibleMessages.length} POSTS
        </div>
      </header>

      <section className="chat-command-strip" aria-label="Server chat status">
        <div><span>Active channel</span><strong>{channel === "global" ? "GLOBAL" : "FACTION"}</strong></div>
        <div><span>Transmissions</span><strong>{messages.length}</strong></div>
        <div><span>Comms status</span><strong>ONLINE</strong></div>
        <div className="chat-season-pill">SEASON I // DRYLANDS</div>
      </section>

      <div className="chat-shell">
        <aside className="chat-rail">
          <div className="chat-label">Choose frequency</div>

          <button
            type="button"
            className={`chat-channel ${channel === "global" ? "is-active" : ""}`}
            onClick={() => setChannel("global")}
          >
            <span className="chat-channel-mark">01</span>
            <span>
              <b>Global</b>
              <small>All survivors</small>
            </span>
            <em>{messages.filter((entry) => entry.channel === "global").length}</em>
          </button>

          <button
            type="button"
            className={`chat-channel ${channel === "faction" ? "is-active" : ""}`}
            disabled={!hasFaction}
            onClick={() => setChannel("faction")}
          >
            <span className="chat-channel-mark">02</span>
            <span>
              <b>Faction</b>
              <small>{hasFaction ? "Private channel" : "Create a faction"}</small>
            </span>
            <em>{hasFaction ? messages.filter((entry) => entry.channel === "faction").length : "LOCK"}</em>
          </button>

          <div className="chat-note">
            <strong>Transmission rules</strong>
            <p>Keep comms clear. Automated filters flag abusive language before it reaches the channel.</p>
          </div>
        </aside>

        <main className="chat-room">
          <div className="chat-room-top">
            <div>
              <span className="chat-room-prefix">TRANSMISSION //</span>
              <h2>{channel === "global" ? "Global Frequency" : "Faction Frequency"}</h2>
            </div>
            <span className="chat-room-state">
              <i /> {channel === "global" ? "OPEN" : "PRIVATE"}
            </span>
          </div>

          <div className="chat-feed">
            {visibleMessages.length === 0 ? (
              <div className="chat-empty">
                <div className="chat-empty-symbol">✦</div>
                <h3>Frequency is quiet</h3>
                <p>Transmit the first message to {channel === "global" ? "the server" : "your faction"}.</p>
              </div>
            ) : (
              visibleMessages.map((entry) => (
                <article className="chat-message" key={entry.id}>
                  <div className="chat-avatar">Y</div>
                  <div className="chat-message-content">
                    <div className="chat-message-meta">
                      <b>You</b>
                      <span>{entry.time}</span>
                      <span>#{channel}</span>
                    </div>

                    {entry.body && <p>{entry.body}</p>}

                    {entry.attachments.length > 0 && (
                      <div className="chat-attachments">
                        {entry.attachments.map((attachment) =>
                          attachment.type.startsWith("image/") ? (
                            <img key={attachment.name} src={attachment.url} alt={attachment.name} />
                          ) : (
                            <div className="chat-file" key={attachment.name}>
                              <IconCheck size={14} />
                              {attachment.name}
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="chat-composer">
            {moderationNotice && <div className="chat-warning">{moderationNotice}</div>}

            {attachments.length > 0 && (
              <div className="chat-preview-row">
                {attachments.map((attachment) => (
                  <div className="chat-preview" key={attachment.name}>
                    {attachment.type.startsWith("image/") ? (
                      <img src={attachment.url} alt={attachment.name} />
                    ) : (
                      <span>{attachment.name}</span>
                    )}
                    <button type="button" onClick={() => removeAttachment(attachment.name)}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="chat-input-row">
              <label className="chat-attach" title="Attach images or files">
                +
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.txt,.zip"
                  onChange={(event) => chooseFiles(event.target.files)}
                />
              </label>

              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={`Transmit to ${channel === "global" ? "everyone" : "your faction"}...`}
                rows={1}
              />

              <button type="button" className="chat-send" onClick={sendMessage}>
                Transmit
              </button>
            </div>

            <small>ENTER TO TRANSMIT · SHIFT + ENTER FOR NEW LINE</small>
          </div>
        </main>

        <aside className="chat-info">
          <div className="chat-label">Room status</div>

          <div className="chat-status-card">
            <span className="chat-status-dot" />
            <div>
              <b>Comms online</b>
              <small>Connection stable</small>
            </div>
          </div>

          <div className="chat-info-block">
            <span>Active room</span>
            <b>{channel === "global" ? "GLOBAL" : "FACTION"}</b>
          </div>

          <div className="chat-info-block">
            <span>Moderation</span>
            <b>AUTOMATIC</b>
            <small>Flagged terms held</small>
          </div>

          <div className="chat-info-block">
            <span>Attachments</span>
            <b>ENABLED</b>
            <small>Images render inline</small>
          </div>
        </aside>
      </div>

      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=MedievalSharp&display=swap");

        .chat-root {
          position: relative;
          min-height: calc(100vh - 5rem);
          padding: 16px 12px 18px;
          color: #f5e6c8;
        }

        .chat-backdrop {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 50% 100%, rgba(141, 62, 20, 0.34), transparent 58%), linear-gradient(180deg, rgba(18, 10, 9, 0.4), rgba(0, 0, 0, 0.16));
          pointer-events: none;
          overflow: hidden;
        }

        .chat-backdrop-glow {
          position: absolute;
          left: 50%;
          bottom: -15%;
          width: 88%;
          height: 52%;
          transform: translateX(-50%);
          background: radial-gradient(ellipse, rgba(245, 113, 33, 0.54), rgba(154, 44, 21, 0.28) 45%, transparent 75%);
          filter: blur(58px);
        }

        .chat-smoke {
          position: absolute;
          bottom: 0;
          width: 360px;
          height: 620px;
          border-radius: 50%;
          filter: blur(36px);
          opacity: 0.38;
          background: radial-gradient(ellipse at 40% 90%, rgba(85, 39, 18, 0.8), rgba(20, 12, 9, 0.22) 48%, transparent 70%);
          animation: chat-smoke-rise 11s ease-in-out infinite;
        }

        .chat-smoke-a { left: 10%; }
        .chat-smoke-b { right: 12%; animation-delay: -3s; }

        @keyframes chat-smoke-rise {
          0%, 100% { transform: translateY(16px) scale(0.92); opacity: 0.25; }
          50% { transform: translateY(-28px) scale(1.05); opacity: 0.45; }
        }

        .chat-ember {
          position: absolute;
          bottom: 4%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 210, 120, 1) 0%, rgba(255, 142, 55, 0.94) 38%, rgba(128, 34, 14, 0.78) 100%);
          box-shadow: 0 0 12px 4px rgba(248, 153, 60, 0.9), 0 0 20px 8px rgba(247, 96, 31, 0.48);
          opacity: 0;
          animation-name: chat-ember-rise;
          animation-timing-function: ease-out;
          animation-iteration-count: infinite;
        }

        @keyframes chat-ember-rise {
          0% { opacity: 0; transform: translate(0, 0) scale(0.5); }
          12% { opacity: 1; }
          50% { opacity: 1; }
          100% { opacity: 0; transform: translate(22px, -620px) scale(0.12); }
        }

        .chat-header,
        .chat-shell {
          position: relative;
          z-index: 1;
        }

        .chat-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin: 0 auto 18px;
          max-width: 1380px;
        }

        .chat-heading {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .chat-kicker,
        .chat-label,
        .chat-room-prefix {
          font: 700 10px ui-monospace, monospace;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: #d09a45;
        }

        .chat-heading h1 {
          margin-top: 5px;
          color: #f4d9a3;
          font-family: "MedievalSharp", Georgia, serif;
          font-size: clamp(2.5rem, 5vw, 4rem);
          line-height: 0.9;
          letter-spacing: 0.04em;
        }

        .chat-heading p {
          margin-top: 8px;
          color: rgba(244, 230, 200, 0.7);
          font-size: 13px;
        }

        .chat-live {
          border: 1px solid rgba(210, 145, 68, 0.35);
          border-radius: 999px;
          background: rgba(70, 35, 12, 0.3);
          padding: 9px 12px;
          color: #f2ca7a;
          font: 700 10px ui-monospace, monospace;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .chat-live span,
        .chat-status-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          margin-right: 7px;
          border-radius: 50%;
          background: #efaf45;
          box-shadow: 0 0 12px rgba(239, 175, 69, 0.9);
          animation: chat-blink 1.6s ease-in-out infinite;
        }

        @keyframes chat-blink {
          50% { opacity: 0.38; transform: scale(0.7); }
        }

        .chat-live b { margin: 0 5px; color: #b8752e; }

        .chat-shell {
          display: grid;
          grid-template-columns: 210px minmax(0, 1fr) 190px;
          max-width: 1440px;
          min-height: 720px;
          margin: 0 auto;
          border: 1px solid rgba(237, 165, 78, 0.3);
          border-radius: 26px;
          background: rgba(16, 12, 9, 0.8);
          box-shadow: 0 30px 100px rgba(0, 0, 0, 0.5), 0 0 60px rgba(193, 101, 32, 0.18), inset 0 0 0 1px rgba(248, 184, 81, 0.08);
          overflow: hidden;
        }

        .chat-rail,
        .chat-room,
        .chat-info {
          padding: 16px;
        }

        .chat-rail {
          display: flex;
          flex-direction: column;
          gap: 14px;
          background: rgba(25, 18, 14, 0.72);
          border-right: 1px solid rgba(218, 154, 81, 0.18);
        }

        .chat-info {
          background: rgba(25, 18, 14, 0.72);
          border-left: 1px solid rgba(218, 154, 81, 0.18);
        }

        .chat-channel {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          border: 1px solid rgba(217, 160, 83, 0.2);
          border-radius: 12px;
          background: rgba(120, 82, 33, 0.08);
          color: #f5eede;
          padding: 10px 10px;
          text-align: left;
          cursor: pointer;
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }

        .chat-channel:hover:not(:disabled) {
          transform: translateX(1px);
          border-color: rgba(244, 192, 91, 0.5);
        }

        .chat-channel.is-active {
          background: linear-gradient(180deg, rgba(187, 97, 25, 0.28), rgba(47, 24, 12, 0.2));
          border-color: rgba(248, 198, 107, 0.5);
          box-shadow: inset 0 0 28px rgba(252, 173, 77, 0.08);
        }

        .chat-channel:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .chat-channel-mark {
          display: grid;
          place-items: center;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: rgba(245, 188, 76, 0.12);
          color: #f4d587;
          font-weight: 700;
        }

        .chat-channel span {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
        }

        .chat-channel b {
          font-size: 12px;
          color: #f7e9d0;
        }

        .chat-channel small {
          color: rgba(245, 233, 214, 0.6);
          font-size: 10px;
        }

        .chat-channel em {
          font-style: normal;
          color: #f4c768;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
        }

        .chat-note {
          margin-top: auto;
          padding: 12px 10px;
          border: 1px solid rgba(230, 171, 79, 0.2);
          border-radius: 12px;
          background: rgba(48, 26, 15, 0.34);
        }

        .chat-note strong {
          color: #efc36a;
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .chat-note p {
          margin-top: 8px;
          color: rgba(245, 233, 214, 0.68);
          font-size: 12px;
          line-height: 1.5;
        }

        .chat-room {
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-width: 0;
          background: rgba(12, 9, 8, 0.36);
        }

        .chat-room-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(217, 160, 83, 0.15);
        }

        .chat-room-top h2 {
          margin-top: 4px;
          color: #f7dc9c;
          font-family: "MedievalSharp", Georgia, serif;
          font-size: clamp(1.5rem, 2vw, 2rem);
          line-height: 1.1;
        }

        .chat-room-state {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 999px;
          border: 1px solid rgba(232, 176, 82, 0.26);
          background: rgba(74, 38, 18, 0.22);
          color: #f3d18b;
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .chat-feed {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 12px;
          min-height: 0;
          overflow: auto;
          padding-right: 6px;
        }

        .chat-empty {
          display: grid;
          place-items: center;
          min-height: 220px;
          border: 1px dashed rgba(219, 162, 80, 0.24);
          border-radius: 16px;
          background: rgba(35, 20, 11, 0.22);
          text-align: center;
          color: rgba(245, 233, 214, 0.7);
        }

        .chat-empty-symbol {
          font-size: 40px;
          color: #efc36a;
        }

        .chat-empty h3 {
          margin-top: 12px;
          color: #f2d89b;
          font-family: "MedievalSharp", Georgia, serif;
          font-size: 1.6rem;
        }

        .chat-message {
          display: flex;
          gap: 10px;
          padding: 12px 12px;
          border: 1px solid rgba(218, 154, 81, 0.16);
          border-radius: 12px;
          background: rgba(17, 13, 11, 0.42);
        }

        .chat-avatar {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(227, 171, 88, 0.28), rgba(98, 48, 18, 0.52));
          color: #f8d89b;
          font-weight: 700;
          flex-shrink: 0;
        }

        .chat-message-content {
          min-width: 0;
          flex: 1;
        }

        .chat-message-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(245, 233, 214, 0.65);
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .chat-message-meta b {
          color: #f5d999;
        }

        .chat-message-content p {
          margin-top: 8px;
          color: #f3ebdf;
          line-height: 1.6;
        }

        .chat-attachments {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 10px;
        }

        .chat-attachments img {
          width: 120px;
          height: 90px;
          border-radius: 8px;
          border: 1px solid rgba(218, 154, 81, 0.2);
          object-fit: cover;
        }

        .chat-file {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid rgba(218, 154, 81, 0.2);
          background: rgba(93, 67, 30, 0.2);
          color: #f3ddad;
          font-size: 12px;
        }

        .chat-composer {
          display: flex;
          flex-direction: column;
          gap: 10px;
          border-top: 1px solid rgba(217, 160, 83, 0.15);
          padding-top: 12px;
        }

        .chat-warning {
          padding: 10px 12px;
          border: 1px solid rgba(220, 110, 78, 0.3);
          border-radius: 10px;
          background: rgba(121, 46, 33, 0.22);
          color: #f7cab6;
          font-size: 12px;
        }

        .chat-preview-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .chat-preview {
          position: relative;
          width: 92px;
          height: 64px;
          overflow: hidden;
          border: 1px solid rgba(218, 154, 81, 0.2);
          border-radius: 10px;
          background: rgba(31, 22, 15, 0.6);
        }

        .chat-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .chat-preview span {
          display: grid;
          place-items: center;
          width: 100%;
          height: 100%;
          color: #f3e1bf;
          font-size: 10px;
          text-align: center;
          padding: 8px;
        }

        .chat-preview button {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 18px;
          height: 18px;
          border: 0;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.65);
          color: white;
          cursor: pointer;
        }

        .chat-input-row {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          padding: 8px 10px;
          border: 1px solid rgba(218, 154, 81, 0.18);
          border-radius: 12px;
          background: rgba(17, 13, 11, 0.42);
        }

        .chat-attach {
          position: relative;
          display: grid;
          place-items: center;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: rgba(241, 179, 72, 0.1);
          color: #f5d58f;
          font-size: 24px;
          cursor: pointer;
          overflow: hidden;
        }

        .chat-attach input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }

        .chat-input-row textarea {
          flex: 1;
          min-height: 42px;
          resize: none;
          border: 0;
          outline: none;
          background: transparent;
          color: #f7ebd9;
          font: inherit;
        }

        .chat-input-row textarea::placeholder {
          color: rgba(245, 233, 214, 0.45);
        }

        .chat-send {
          border: 1px solid rgba(222, 167, 82, 0.38);
          border-radius: 10px;
          background: linear-gradient(180deg, #c9762a, #7a421d);
          color: #fff0d2;
          padding: 10px 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .chat-composer small {
          color: rgba(245, 233, 214, 0.44);
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .chat-status-card,
        .chat-info-block {
          border: 1px solid rgba(218, 154, 81, 0.2);
          border-radius: 12px;
          background: rgba(30, 22, 15, 0.48);
        }

        .chat-status-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 10px;
          margin-top: 10px;
          color: #f5d98c;
        }

        .chat-status-card b {
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .chat-status-card small {
          display: block;
          margin-top: 3px;
          color: rgba(245, 233, 214, 0.6);
        }

        .chat-info-block {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 12px 10px;
          margin-top: 12px;
        }

        .chat-info-block span {
          color: rgba(245, 233, 214, 0.52);
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .chat-info-block b {
          color: #f4d99a;
          font-size: 16px;
        }

        .chat-info-block small {
          color: rgba(245, 233, 214, 0.66);
          font-size: 11px;
        }

        @media (max-width: 980px) {
          .chat-shell {
            grid-template-columns: 1fr;
          }

          .chat-info {
            border-left: 0;
            border-top: 1px solid rgba(218, 154, 81, 0.18);
          }
        }

        .chat-root {
          min-height: calc(100vh - 3rem);
          padding: 28px 24px 24px;
          background: linear-gradient(180deg, rgba(9, 7, 6, 0.78), rgba(14, 10, 9, 0.92));
        }

        .chat-backdrop {
          background: radial-gradient(circle at 50% 100%, rgba(194, 82, 30, 0.22), transparent 40%), linear-gradient(180deg, rgba(9, 7, 6, 0.72), rgba(14, 10, 9, 0.92));
        }

        .chat-desert {
          position: absolute;
          inset: 0;
          background: url('/drylands.png') center top / cover no-repeat;
          opacity: 0.23;
          filter: saturate(1.1) contrast(1.12);
        }

        .chat-header,
        .chat-command-strip,
        .chat-shell { max-width: 1380px; }

        .chat-header { margin-bottom: 18px; }

        .chat-heading h1 {
          font-size: clamp(3rem, 6vw, 5rem);
          line-height: 0.9;
          letter-spacing: 0.04em;
          color: #fceac9;
          text-shadow: 0 0 30px rgba(186, 68, 29, 0.5), 0 3px 0 rgba(18, 8, 7, 0.9);
        }

        .chat-kicker { color: rgba(244, 189, 96, 0.8); }

        .chat-command-strip {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(3, 1fr) auto;
          align-items: center;
          gap: 16px;
          margin: 0 auto 26px;
          padding: 16px 18px;
          border: 1px solid rgba(233, 168, 84, 0.3);
          border-radius: 18px;
          background: linear-gradient(90deg, rgba(35, 22, 16, 0.82), rgba(18, 13, 11, 0.7));
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.28);
        }

        .chat-command-strip > div:not(.chat-season-pill) { display: grid; gap: 4px; }
        .chat-command-strip span { color: rgba(245, 228, 197, 0.6); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; }
        .chat-command-strip strong { color: #f4d391; font: 400 1.55rem "MedievalSharp", Georgia, serif; }
        .chat-season-pill { border: 1px solid rgba(235, 172, 87, 0.28); border-radius: 999px; padding: 7px 12px; background: rgba(88, 46, 24, 0.36); color: #f3d28f !important; font-size: 10px !important; letter-spacing: 0.15em; white-space: nowrap; }

        .chat-shell {
          min-height: 650px;
          border: 1px solid rgba(231, 170, 86, 0.22);
          border-radius: 28px;
          background: rgba(16, 11, 9, 0.75);
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 188, 112, 0.04);
        }

        .chat-rail,
        .chat-info { background: rgba(25, 16, 12, 0.78); }
        .chat-rail { border-right-color: rgba(218, 154, 81, 0.2); }
        .chat-info { border-left-color: rgba(218, 154, 81, 0.2); }
        .chat-channel { min-height: 76px; border-radius: 16px; background: linear-gradient(180deg, rgba(32, 18, 12, 0.85), rgba(15, 11, 9, 0.92)); }
        .chat-channel.is-active { background: linear-gradient(180deg, rgba(187, 97, 25, 0.28), rgba(47, 24, 12, 0.2)); border-color: rgba(248, 198, 107, 0.5); }
        .chat-channel-mark { width: 38px; height: 38px; border-radius: 12px; color: #f3cf8c; font: 400 1rem "MedievalSharp", Georgia, serif; }
        .chat-room { background: rgba(12, 9, 8, 0.48); }
        .chat-room-top { padding: 18px 20px; border-bottom-color: rgba(217, 160, 83, 0.2); }
        .chat-room-top h2 { color: #f5dfb6; font-size: 1.8rem; }
        .chat-message { border-radius: 16px; border-color: rgba(224, 162, 77, 0.18); background: linear-gradient(180deg, rgba(32, 18, 12, 0.72), rgba(15, 11, 9, 0.72)); }
        .chat-avatar { border-radius: 12px; background: linear-gradient(135deg, rgba(227, 171, 88, 0.28), rgba(98, 48, 18, 0.52)); }
        .chat-composer { border-top-color: rgba(217, 160, 83, 0.2); }
        .chat-input-row { border-radius: 16px; background: rgba(17, 13, 11, 0.72); }
        .chat-send { border-radius: 12px; background: linear-gradient(180deg, #c9762a, #7a421d); }

        @media (max-width: 700px) {
          .chat-root { padding: 20px 12px; }
          .chat-command-strip { grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 14px; }
          .chat-command-strip strong { font-size: 1.1rem; }
          .chat-season-pill { grid-column: 1 / -1; text-align: center; }
        }
      `}</style>
    </div>
  );
}
