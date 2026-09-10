/**
 * Text-level builders/patchers for DayZ CE config files. No XML parser
 * dependency (Cloudflare Workers runtime) — events are unique by `name`, so
 * a single event block is located by regex and replaced/appended in place.
 */

export type EventSpawnParams = {
  eventName: string;
  classname: string;
  lifetime: number;
  restock: number;
  x: number;
  z: number;
  a: number;
};

export function buildEventXmlNode({ eventName, classname, lifetime, restock }: EventSpawnParams): string {
  return `    <event name="${eventName}">
        <nominal>1</nominal>
        <min>1</min>
        <max>1</max>
        <lifetime>${lifetime}</lifetime>
        <restock>${restock}</restock>
        <saferadius>0</saferadius>
        <distanceradius>0</distanceradius>
        <cleanupradius>200</cleanupradius>
        <flags deletable="0" init_random="0" remove_damaged="1"/>
        <position>fixed</position>
        <limit>child</limit>
        <active>1</active>
        <children>
            <child lootmax="0" lootmin="0" max="1" min="1" type="${classname}"/>
        </children>
    </event>`;
}

export function buildSpawnPosXmlNode({ eventName, x, z, a }: EventSpawnParams): string {
  return `    <event name="${eventName}">
        <pos x="${x}" z="${z}" a="${a}"/>
    </event>`;
}

/** Replace the `<event name="...">...</event>` block if present, else insert before the closing root tag. */
export function upsertEventBlock(xmlText: string, eventName: string, newBlock: string, closingRootTag: string): string {
  const escaped = eventName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const existing = new RegExp(`[ \\t]*<event name="${escaped}">[\\s\\S]*?</event>\\s*`, "m");
  if (existing.test(xmlText)) {
    return xmlText.replace(existing, `${newBlock}\n`);
  }
  const closeTag = new RegExp(`</${closingRootTag}>`);
  if (!closeTag.test(xmlText)) {
    throw new Error(`Could not find </${closingRootTag}> to insert event "${eventName}"`);
  }
  return xmlText.replace(closeTag, `${newBlock}\n</${closingRootTag}>`);
}
