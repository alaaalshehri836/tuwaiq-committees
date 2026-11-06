export type CommitteeId = 'media' | 'hr' | 'quality-of-life' | 'sports' | 'relations';

export type Route =
  | { scene: 'entrance' }
  | { scene: 'hall' }
  | { scene: 'detail'; id: CommitteeId };
