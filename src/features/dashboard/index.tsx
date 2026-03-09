"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Stepper } from "@/components/ui/stepper";
import { useState } from "react";
const steps = [
  {
    id: 1,
    title: "Step One",
    description: "Desc for step one",
  },
  {
    id: 2,
    title: "Step Two",
    description: "Desc for step two",
  },
  {
    id: 3,
    title: "Step Three",
    description: "Desc for step three",
  },
  {
    id: 4,
    title: "Step Four",
    description: "Desc for step four",
  },
];

const DashboardPage = () => {
  const [horizontalStep, setHorizontalStep] = useState<number | string>(1);
  const [verticalStep, setVerticalStep] = useState<number | string>(1);

  const handleHorizontalNext = () => {
    const currentIndex = steps.findIndex((s) => s.id === horizontalStep);
    if (currentIndex < steps.length - 1) {
      setHorizontalStep(steps[currentIndex + 1].id);
    }
  };

  const handleVerticalNext = () => {
    const currentIndex = steps.findIndex((s) => s.id === verticalStep);
    if (currentIndex < steps.length - 1) {
      setVerticalStep(steps[currentIndex + 1].id);
    }
  };

  const handleVerticalPrev = () => {
    const currentIndex = steps.findIndex((s) => s.id === verticalStep);
    if (currentIndex > 0) {
      setVerticalStep(steps[currentIndex - 1].id);
    }
  };

  return (
    <main className="bg-background min-h-screen p-8">
      <div className="mx-auto max-w-6xl space-y-12">
        {/* Horizontal Stepper */}
        <Card>
          <CardHeader>
            <CardTitle>Horizontal Stepper</CardTitle>
            <CardDescription>
              Linear progression through steps from left to right
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <Stepper
              steps={steps}
              currentStep={horizontalStep}
              onStepChange={setHorizontalStep}
              orientation="horizontal"
            />
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  const currentIndex = steps.findIndex(
                    (s) => s.id === horizontalStep,
                  );
                  if (currentIndex > 0) {
                    setHorizontalStep(steps[currentIndex - 1].id);
                  }
                }}
              >
                Previous
              </Button>
              <Button onClick={handleHorizontalNext}>Next</Button>
            </div>
          </CardContent>
        </Card>

        {/* Vertical Stepper */}
        <Card>
          <CardHeader>
            <CardTitle>Vertical Stepper</CardTitle>
            <CardDescription>
              Linear progression through steps from top to bottom
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <Stepper
              steps={steps}
              currentStep={verticalStep}
              onStepChange={setVerticalStep}
              orientation="vertical"
            />
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={handleVerticalPrev}>
                Previous
              </Button>
              <Button onClick={handleVerticalNext}>Next</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default DashboardPage;
