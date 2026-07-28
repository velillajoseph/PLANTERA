import { notFound } from 'next/navigation';
import PlantDetail from '../../../../components/PlantDetail';
import { getPlant, plants } from '../../../../lib/plants';

export function generateStaticParams() {
  return plants.map((plant) => ({ slug: plant.slug }));
}

export default function PlantDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const plant = getPlant(params.slug);

  if (!plant) {
    notFound();
  }

  return <PlantDetail plant={plant} />;
}
