export const sudanLocationKeys = [
    'sudan',
    'khartoum',
    'omdurman',
    'bahri',
    'port_sudan',
    'kassala',
    'wad_madani',
    'el_obeid',
    'nyala',
    'atbara',
    'gedaref',
    'el_fasher',
    'kosti',
    'remote',
] as const;

export type SudanLocationKey = (typeof sudanLocationKeys)[number];
