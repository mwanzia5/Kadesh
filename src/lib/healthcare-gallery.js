// Curated from the existing Ohana Care Clinic gallery, which includes both projects.
// Keep the published gallery URLs so the original photographs stay in one place.
const galleryImage = (file) =>
  `https://trzmdofcpoqhtvwsjsqq.supabase.co/storage/v1/object/public/images/gallery/${file}.webp`;

export const HEALTHCARE_GALLERY_HREF =
  "/gallery?project=ohana-care-clinic#gallery-content";
export const OHANA_HERO = galleryImage("1790630950922");
export const HOMECARE_HERO = galleryImage("1790608179234");

export const HEALTHCARE_GALLERY = {
  "ohana-care": [
    {
      src: galleryImage("1790630978643"),
      alt: "Reception and seating inside Ohana Care Clinic",
      caption: "A welcoming place for care",
    },
    {
      src: galleryImage("1790630954006"),
      alt: "Guests gathered inside Ohana Care Clinic for its opening",
      caption: "A shared beginning",
    },
    {
      src: galleryImage("1790631061749"),
      alt: "The corridor and pharmacy entrance at Ohana Care Clinic",
      caption: "Spaces prepared to serve",
    },
  ],
  "home-care": [
    {
      src: galleryImage("1790608180628"),
      alt: "A healthcare worker using a stethoscope during a care visit",
      caption: "Personal attention",
    },
    {
      src: galleryImage("1790608268508"),
      alt: "A healthcare worker speaking with a community member at a consultation table",
      caption: "Time to listen",
    },
    {
      src: galleryImage("1790608269884"),
      alt: "A care team member and a man standing outdoors in the community",
      caption: "Care through connection",
    },
  ],
};
