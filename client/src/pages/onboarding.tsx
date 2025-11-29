import React, { useState } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import generatedImage from '@assets/generated_images/app_icon_for_bazaarbudget_financial_app.png';

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
    else setLocation("/home");
  };

  const variants = {
    enter: { x: 100, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 }
  };

  return (
    <MobileShell showNav={false} className="flex flex-col items-center justify-center p-6 bg-white">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div 
            key="step0"
            variants={variants} initial="enter" animate="center" exit="exit"
            className="flex flex-col items-center text-center space-y-6 w-full"
          >
            <img 
              src={generatedImage} 
              alt="BazaarBudget Logo" 
              className="w-24 h-24 rounded-2xl shadow-xl mb-4"
            />
            <h1 className="text-3xl font-bold text-foreground tracking-tight">BazaarBudget</h1>
            <p className="text-muted-foreground text-lg">
              India's first family finance app. <br/>
              <span className="font-medium text-primary">Zero manual entry.</span>
            </p>
            <div className="w-full pt-8">
              <Button size="lg" className="w-full text-lg h-14 rounded-xl" onClick={nextStep}>
                Get Started <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div 
            key="step1"
            variants={variants} initial="enter" animate="center" exit="exit"
            className="w-full space-y-6"
          >
            <h2 className="text-2xl font-bold">Are you married?</h2>
            <div className="grid grid-cols-1 gap-4">
              <Button variant="outline" size="lg" className="h-16 text-lg justify-between px-6" onClick={nextStep}>
                Yes <Check className="w-5 h-5 text-green-500" />
              </Button>
              <Button variant="outline" size="lg" className="h-16 text-lg justify-between px-6" onClick={nextStep}>
                No
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            variants={variants} initial="enter" animate="center" exit="exit"
            className="w-full space-y-6"
          >
            <h2 className="text-2xl font-bold">Do parents live with you?</h2>
            <div className="grid grid-cols-1 gap-4">
              <Button variant="outline" size="lg" className="h-16 text-lg justify-between px-6" onClick={nextStep}>
                Yes <Check className="w-5 h-5 text-green-500" />
              </Button>
              <Button variant="outline" size="lg" className="h-16 text-lg justify-between px-6" onClick={nextStep}>
                No
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            variants={variants} initial="enter" animate="center" exit="exit"
            className="w-full space-y-6"
          >
            <h2 className="text-2xl font-bold">Any other income?</h2>
            <p className="text-muted-foreground">Freelance, Shop, or Agriculture?</p>
            <div className="grid grid-cols-1 gap-4">
              <Button variant="outline" size="lg" className="h-16 text-lg justify-between px-6" onClick={nextStep}>
                Yes, I have side income
              </Button>
              <Button variant="outline" size="lg" className="h-16 text-lg justify-between px-6" onClick={nextStep}>
                No, just Salary
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {step > 0 && (
        <div className="fixed top-6 right-6 text-sm text-muted-foreground font-medium">
          {step} / 3
        </div>
      )}
    </MobileShell>
  );
}
