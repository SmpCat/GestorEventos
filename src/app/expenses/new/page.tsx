import { getSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ReceiptUploader from '@/components/ReceiptUploader';

export const dynamic = 'force-dynamic';

export default async function NewExpensePage() {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.2rem' }}>Añadir Gasto</h1>
          <p className="text-secondary">Sube una foto del ticket de compra</p>
        </div>
        <Link href="/" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', textDecoration: 'none' }}>
          Volver
        </Link>
      </div>

      <ReceiptUploader />
    </div>
  );
}
