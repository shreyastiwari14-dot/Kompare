import Hero from "@/components/home/Hero";
import Marquee from "@/components/home/Marquee";
import Stats from "@/components/home/Stats";
import HowItWorks from "@/components/home/HowItWorks";
import CategoriesPreview from "@/components/home/CategoriesPreview";

export default function Home() {
  return (
    <div className="w-full bg-white dark:bg-black">
      <Hero />
      <Marquee />
      <Stats />
      <HowItWorks />
      <CategoriesPreview />
    </div>
  );
}
