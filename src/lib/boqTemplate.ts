export type BoqTemplateItem = {
  description: string
  unit: string
  quantity: number
  rate: number
}

export type BoqTemplateSection = {
  title: string
  items: BoqTemplateItem[]
}

/** Default 8-stage structure from N.Moyo Stand 1284 sample BOQ. */
export const NMOMYO_BOQ_TEMPLATE: BoqTemplateSection[] = [
  {
    title: 'Stage 1: Superstructure Brickwork, Lintels & Ring Beam',
    items: [
      { description: 'Common clay / cement bricks (230x115x75mm)', unit: 'Each', quantity: 21500, rate: 0.16 },
      { description: 'Ordinary Portland Cement (50kg bags)', unit: 'Bags', quantity: 155, rate: 11.5 },
      { description: 'Brickforce & wall ties', unit: 'Item', quantity: 1, rate: 0 },
    ],
  },
  {
    title: 'Stage 2: Roof Structure & Roof Coverings',
    items: [
      { description: 'Treated SA Pine structural roof timber', unit: 'Lengths', quantity: 145, rate: 13.5 },
      { description: 'IBR Chromadek / Aluzinc 0.5mm roof sheets', unit: 'm²', quantity: 215, rate: 11.5 },
    ],
  },
  {
    title: 'Stage 3: Glazing, Windows & Doors',
    items: [{ description: 'Aluminium windows & external doors — supply & install', unit: 'Item', quantity: 1, rate: 0 }],
  },
  {
    title: 'Stage 4: Plumbing, Sanitaryware & Drainage',
    items: [{ description: 'Hot & cold water reticulation, sanitaryware, drainage', unit: 'Item', quantity: 1, rate: 0 }],
  },
  {
    title: 'Stage 5: Electrical Installation & DB Boards',
    items: [{ description: 'Electrical installation to SANS incl. DB boards', unit: 'Item', quantity: 1, rate: 0 }],
  },
  {
    title: 'Stage 6: Plastering, Ceiling & Floor Screeding',
    items: [{ description: 'Internal plaster, ceilings, floor screeds', unit: 'Item', quantity: 1, rate: 0 }],
  },
  {
    title: 'Stage 7: Floor & Wall Tiling, BICs & Kitchen Fittings',
    items: [{ description: 'Floor & wall tiling, built-in cupboards, kitchen', unit: 'Item', quantity: 1, rate: 0 }],
  },
  {
    title: 'Stage 8: Painting, Varnishing, External Aprons & Final Commissioning',
    items: [
      {
        description: 'Painting, varnishing, external aprons & final commissioning',
        unit: 'Item',
        quantity: 1,
        rate: 0,
      },
    ],
  },
]