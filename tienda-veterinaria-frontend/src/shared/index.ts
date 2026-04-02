// UI
import ConfirmModal from './components/ui/ConfirmModal';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Layout
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/layout/ScrollToTop';

// API
import api from './api/axios';

// Store
import { useThemeStore } from './store/useThemeStore';

// Types
export * from './types';
import * as Types from './types';

export { ConfirmModal, LoadingSpinner, Header, Footer, ScrollToTop, api, useThemeStore };

// Default export for consumers expecting a default import
const shared = {
  ConfirmModal,
  LoadingSpinner,
  Header,
  Footer,
  ScrollToTop,
  api,
  useThemeStore,
  ...Types,
};

export default shared;

