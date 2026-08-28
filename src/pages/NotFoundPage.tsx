import { useNavigate } from 'react-router-dom';
import { FiCompass } from 'react-icons/fi';
import Container from '../components/layout/Container';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * Catch-all for any URL that doesn't match a real route. Without this,
 * React Router's <Routes> renders nothing at all for an unmatched path —
 * a completely blank white screen, no chrome, no way back — for anyone
 * hitting a typo'd URL, a stale bookmark, or a broken external link.
 */
const NotFoundPage = () => {
  useDocumentTitle('Page Not Found');
  const navigate = useNavigate();

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-10">
      <EmptyState
        icon={<FiCompass size={32} />}
        title="Page not found"
        description="The page you're looking for doesn't exist or may have moved."
        action={
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            Back to dashboard
          </Button>
        }
      />
    </Container>
  );
};

export default NotFoundPage;
