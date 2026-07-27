import Link from 'next/link';
import type { Plant } from '../lib/plants';
import { getVendor } from '../lib/vendors';

export default function PlantCard({ plant }: { plant: Plant }) {
  const vendor = getVendor(plant.vendorId);

  return (
    <Link href={`/plants/${plant.slug}`} className="plant-card">
      <div className="frame frame--45">
        <img src={plant.image} alt={plant.name} loading="lazy" />
      </div>
      <div style={{ display: 'grid', gap: '0.3rem' }}>
        <span className="plant-card__vendor">{vendor?.name}</span>
        <h3 className="plant-card__name">{plant.name}</h3>
        <span className="plant-card__price">${plant.price.toFixed(2)}</span>
      </div>
    </Link>
  );
}
