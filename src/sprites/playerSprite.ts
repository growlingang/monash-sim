export type LayerKey =
  | 'skin'
  | 'hair'
  | 'eyes'
  | 'lipstick'
  | 'shirt'
  | 'bottom'
  | 'shoes'
  | 'beard'
  | 'earring'
  | 'glasses'
  | 'hat';

export type Accessories = {
  beard?: string | null;
  earring?: string | null;
  glasses?: string | null;
  hat?: string | null;
};

export type PlayerSprite = {
  skin: string;
  hair: string;
  eyes: string;
  lipstick?: string | null;
  shirt?: string | null;
  bottom?: string | null;
  shoes?: string | null;
  accessories: Accessories;
  compositedImage?: HTMLImageElement;  // Cached flattened sprite sheet
};

export const DEFAULT_PLAYER: PlayerSprite = {
  skin: 'skintone_4.png',
  hair: 'emo_darkbrown.png',
  eyes: 'eyes_brown.png',
  lipstick: null,
  shirt: 'shirt_blue.png',
  bottom: 'pants_black.png',
  shoes: 'shoes_black.png',
  accessories: {
    beard: null,
    earring: null,
    glasses: null,
    hat: null,
  },
};

// Basic equipment lists (file names relative to /player/layers)
export const EQUIPMENT = {
  skins: ['skintone_2.png', 'skintone_4.png', 'skintone_6.png'],
  hairs: [
    'emo_lightbrown.png',
    'emo_darkbrown.png',
    'emo_blonde.png',
    'wavy_lightbrown.png',
    'wavy_darkbrown.png',
    'wavy_blonde.png',
    'ponytail_lightbrown.png',
    'ponytail_darkbrown.png',
    'ponytail_blonde.png',
  ],
  eyes: ['eyes_brown.png', 'eyes_blue.png', 'eyes_black.png'],
  lipsticks: ['lipstick_red.png', 'lipstick_darkred.png', 'lipstick_pink.png'],
  shirts: ['shirt_black.png', 'shirt_white.png', 'shirt_blue.png'],
  bottoms: ['pants_black.png', 'pants_red.png', 'skirt_black.png', 'skirt_red.png'],
  shoes: ['shoes_black.png', 'shoes_red.png'],
  accessories: {
    beard: ['beard.png'],
    earring: ['earring_red.png'],
    glasses: ['glasses.png', 'glasses_sun.png'],
    hat: ['hat_cowboy.png', 'hat_pumpkin.png'],
  },
};