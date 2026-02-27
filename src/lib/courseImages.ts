// Centralized image mapping for courses by slug
// Used as fallback when DB image_url is a relative path

import imgVocal from "@/assets/gallery/NGZ6R_1512_R.webp";
import imgMaleChorus from "@/assets/gallery/NGDSC_8160.webp";
import imgDanceGroup from "@/assets/gallery/NGDSC_7428.webp";
import imgPercussion from "@/assets/gallery/NGZ6R_6439_R.webp";
import imgSitar from "@/assets/gallery/NGMUSIC-2.webp";
import imgMusic13 from "@/assets/gallery/NGMUSIC-13.webp";

export const courseImageMap: Record<string, string> = {
  "carnatic-vocal": imgVocal,
  "hindustani-vocal": imgMaleChorus,
  "bharatanatyam": imgDanceGroup,
  "mridangam": imgPercussion,
  "tabla": imgPercussion,
  "sitar": imgSitar,
};

export const defaultCourseImage = imgMusic13;

export const getCourseImage = (course: { slug?: string | null; thumbnail_url?: string | null; image_url?: string | null }) => {
  if (course.slug && courseImageMap[course.slug]) return courseImageMap[course.slug];
  if (course.thumbnail_url && course.thumbnail_url.startsWith("http")) return course.thumbnail_url;
  if (course.image_url && course.image_url.startsWith("http")) return course.image_url;
  return defaultCourseImage;
};
