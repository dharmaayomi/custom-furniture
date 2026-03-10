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

  return (
    <main className="bg-background min-h-screen p-8">
      <div className="mx-auto max-w-6xl space-y-12">
        {/* Horizontal Stepper */}
        ini punya user
      </div>
    </main>
  );
};

export default DashboardPage;
