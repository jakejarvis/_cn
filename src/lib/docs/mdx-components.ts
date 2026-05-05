export const docsMdxComponentNames = ["Callout"] as const;

export type DocsMdxComponentName = (typeof docsMdxComponentNames)[number];

export const docsMdxComponentNameSet: ReadonlySet<string> = new Set(docsMdxComponentNames);
