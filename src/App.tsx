import { Routes, Route } from 'react-router-dom';
import StyleGuideLayout from './routes/StyleGuideLayout';
import Overview from './routes/Overview';
import Surface from './routes/Surface';
import ButtonRoute from './routes/Button';
import InputRoute from './routes/Input';
import FeedbackRoute from './routes/Feedback';
import OverlayRoute from './routes/Overlay';
import TokensRoute from './routes/Tokens';

export default function App() {
  return (
    <Routes>
      <Route element={<StyleGuideLayout />}>
        <Route index element={<Overview />} />
        <Route path="/surface" element={<Surface />} />
        <Route path="/button" element={<ButtonRoute />} />
        <Route path="/input" element={<InputRoute />} />
        <Route path="/feedback" element={<FeedbackRoute />} />
        <Route path="/overlay" element={<OverlayRoute />} />
        <Route path="/tokens" element={<TokensRoute />} />
      </Route>
    </Routes>
  );
}