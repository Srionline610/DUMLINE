import React from 'react';
import CinematicBrandIntro from '../components/customer/CinematicBrandIntro';
import CulinaryJourneyNav from '../components/customer/CulinaryJourneyNav';
import HeroSection from '../components/customer/HeroSection';
import OutletSelectorSection from '../components/customer/OutletSelectorSection';
import SignatureSpotlight from '../components/customer/SignatureSpotlight';
import SignatureDishes from '../components/customer/SignatureDishes';
import DumHeritageStory from '../components/customer/DumHeritageStory';
import DumCookingTimeline from '../components/customer/DumCookingTimeline';
import IngredientDiscovery from '../components/customer/IngredientDiscovery';
import CulinaryPairings from '../components/customer/CulinaryPairings';

export default function HomePage() {
  return (
    <div className="flex flex-col w-full scroll-smooth">
      <CinematicBrandIntro />
      <CulinaryJourneyNav />
      <div id="hero">
        <HeroSection />
      </div>
      <div id="outlets">
        <OutletSelectorSection />
      </div>
      <div id="spotlight">
        <SignatureSpotlight />
      </div>
      <div id="signatures">
        <SignatureDishes />
      </div>
      <div id="heritage">
        <DumHeritageStory />
      </div>
      <div id="timeline">
        <DumCookingTimeline />
      </div>
      <div id="ingredients">
        <IngredientDiscovery />
      </div>
      <div id="pairings">
        <CulinaryPairings />
      </div>
    </div>
  );
}
