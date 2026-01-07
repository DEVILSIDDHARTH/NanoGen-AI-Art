
export enum ArtStyle {
  NONE = 'No Style',
  PAL = 'Pal',
  REALISTIC = 'Photorealistic',
  ANIME = 'Anime/Manga',
  GHIBLI = 'Studio Ghibli',
  PIXEL_ART = 'Pixel Art',
  CYBERPUNK = 'Cyberpunk',
  SWIMWEAR = 'Swimwear / Bikini',
  FRENCH_KISS = 'Romantic / French Kiss',
  WATERCOLOR = 'Watercolor',
  OIL_PAINTING = 'Oil Painting',
  THREE_D_RENDER = '3D Render',
  VINTAGE = 'Vintage Photograph',
  SKETCH = 'Pencil Sketch',
  POP_ART = 'Pop Art',
  UKIOYE = 'Ukiyo-e',
  STEAMPUNK = 'Steampunk',
  LOW_POLY = 'Low Poly',
  ISOMETRIC = 'Isometric',
  CLAYMATION = 'Claymation',
  ORIGAMI = 'Origami',
  NEON_NOIR = 'Neon Noir',
  ABSTRACT = 'Abstract Expressionism'
}

export enum PoseStyle {
  NONE = 'Default',
  STANDING = 'Standing',
  SITTING = 'Sitting / Relaxed',
  WALKING = 'Walking',
  RUNNING = 'Running / Sprinting',
  JUMPING = 'Jumping / Airborne',
  DANCING = 'Dancing',
  FIGHTING = 'Fighting Stance',
  SUPERHERO = 'Superhero Landing',
  YOGA = 'Yoga Pose',
  FLYING = 'Flying / Floating',
  KNEELING = 'Kneeling',
  DOG_POSE = 'Dog Pose'
}

export enum CameraStyle {
  NONE = 'Default',
  FULL_BODY = 'Full length composition',
  CLOSE_UP = 'Close-up portrait view',
  MEDIUM_SHOT = 'Medium length composition',
  WIDE_ANGLE = 'Wide angle perspective',
  LOW_ANGLE = 'Low angle heroic perspective',
  HIGH_ANGLE = 'High angle perspective',
  OVERHEAD = 'Aerial overhead perspective',
  FISHEYE = 'Fisheye lens perspective',
  MACRO = 'Macro detail focus',
  CINEMATIC = 'Cinematic composition',
  CINEMATIC_LIGHTING = 'Dramatically lit cinematic scene',
  BOKEH = 'Deep depth of field with bokeh',
  ISOMETRIC_VIEW = 'Isometric view perspective'
}

export enum LensStyle {
  NONE = 'Standard Lens',
  ULTRA_WIDE_14MM = '14mm Ultra Wide',
  WIDE_24MM = '24mm Wide Angle',
  STREET_35MM = '35mm Street Lens',
  STANDARD_50MM = '50mm Nifty Fifty',
  PORTRAIT_85MM = '85mm Portrait Prime',
  TELEPHOTO_135MM = '135mm Telephoto',
  SPORT_200MM = '200mm Sport Zoom',
  WILDLIFE_400MM = '400mm Wildlife Prime',
  MACRO = 'Macro Detail Lens',
  FISHEYE_EXTREME = 'Extreme Fisheye',
  TILT_SHIFT = 'Tilt-Shift Miniature',
  ANAMORPHIC = 'Anamorphic Widescreen',
  LEICA_VINTAGE = 'Vintage Leica M Look',
  HELIOS_44 = 'Helios 44-2 Swirly Bokeh',
  PETZVAL = 'Petzval Artistic Lens',
  PINHOLE = 'Pinhole Aesthetic',
  DISPOSABLE = 'Disposable Camera Lens',
  INFRARED = 'Infrared Spectrum',
  PRISM = 'Prism Rainbow Lens',
  STAR_FILTER = 'Star Filter Lens',
  BLUE_STREAK = 'Blue Streak Anamorphic',
  BORESCOPE = 'Borescope Probe',
  CCTV = 'CCTV Surveillance Lens',
  TOY_LENS = 'Toy Plastic Lens',
  SOFT_FOCUS = 'Soft Focus Dreamy',
  POLARIZED = 'Polarized Clear View',
  SUPER_8 = 'Super-8 Vintage Film',
  IMAX = 'IMAX 70mm Format'
}

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
export type ImageResolution = "1K" | "2K" | "4K" | "8K";

export interface GeneratedImage {
  id: string;
  url: string; // Base64 data URL
  prompt: string;
  style: ArtStyle;
  pose?: PoseStyle;
  camera?: CameraStyle;
  lens?: LensStyle;
  aspectRatio?: AspectRatio;
  resolution?: ImageResolution;
  timestamp: number;
}
