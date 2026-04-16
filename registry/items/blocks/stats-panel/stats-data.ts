type Stat = {
  label: string;
  value: string;
  detail: string;
};

const stats: Stat[] = [
  {
    label: "Components",
    value: "12",
    detail: "Ready to publish",
  },
  {
    label: "Blocks",
    value: "3",
    detail: "Documented examples",
  },
  {
    label: "Schema",
    value: "100%",
    detail: "Validated output",
  },
];

export { stats, type Stat };
