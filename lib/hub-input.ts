import {
  HUB_DIMENSION_FIELDS,
  type Dimension,
  type ESGInput,
  type FINInput,
  type HubInput,
  type LOGInput,
  type MKTInput,
  type RHInput,
} from "./types";

/** Numeric answers keyed by dimension → field. */
export type HubValues = Record<Dimension, Record<string, number>>;

export function emptyHubValues(): HubValues {
  return { rh: {}, fin: {}, log: {}, mkt: {}, esg: {} };
}

/** Builds a HubInput (with no actions) from per-dimension values. */
export function toHubInput(values: HubValues): HubInput {
  const pick = (dim: Dimension) =>
    Object.fromEntries(
      HUB_DIMENSION_FIELDS[dim].map((field) => [field, values[dim][field]]),
    );

  return {
    acoes: [],
    rh: pick("rh") as unknown as RHInput,
    fin: pick("fin") as unknown as FINInput,
    log: pick("log") as unknown as LOGInput,
    mkt: pick("mkt") as unknown as MKTInput,
    esg: pick("esg") as unknown as ESGInput,
  };
}
