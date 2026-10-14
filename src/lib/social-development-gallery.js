// Original photographs already published in the project's main gallery.
const photo = (id) =>
  `https://trzmdofcpoqhtvwsjsqq.supabase.co/storage/v1/object/public/images/gallery/${id}.webp`;
export const BREAD_HERO = photo("1790607505448");
export const BOREWELL_HERO = photo("1790607916245");
export const SOCIAL_GALLERY = {
  "bethlehem-bread": [
    {
      src: photo("1790607504220"),
      alt: "Two bakery team members preparing bread in the project kitchen",
      caption: "Prepared with purpose",
    },
    {
      src: photo("1790607703446"),
      alt: "Packaged loaves and bread rolls from the Bethlehem Bread bakery",
      caption: "Ready to share",
    },
    {
      src: photo("1790607537001"),
      alt: "Children and community members holding packages of bread",
      caption: "Reaching our community",
    },
  ],
  borewell: [
    {
      src: photo("1790607909496"),
      alt: "A child with yellow water containers beside a path",
      caption: "The everyday need",
    },
    {
      src: photo("1790607914930"),
      alt: "Community members carrying yellow water containers along a path",
      caption: "The journey for water",
    },
    {
      src: BOREWELL_HERO,
      alt: "Community members collecting water from a hand pump",
      caption: "A shared source of water",
    },
  ],
};
