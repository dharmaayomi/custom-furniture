import { DesignCodePage } from "@/features/custom/designCode";

type PageProps = {
  params: Promise<{ designCode: string }>;
};

const ShareableDesign = async ({ params }: PageProps) => {
  const { designCode } = await params;
  return <DesignCodePage designCode={designCode} />;
};

export default ShareableDesign;
