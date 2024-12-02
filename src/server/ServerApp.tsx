import { UserButton } from "@clerk/clerk-react";
import PricingSection from "../components/PricingSection";
import ExampleSection from "../components/ExampleSection";
import FAQSection from "../components/FAQSection";
import Footer from "../components/Footer";


// Server-side version of App with minimal interactive features
function ServerApp() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">VizMuze</h1>
          <UserButton />
        </header>
        <ExampleSection />
        <PricingSection />
        <FAQSection />
        <Footer />
      </div>
    </div>
  );
}

export default ServerApp;
