import { Routes, Route, Navigate } from 'react-router-dom';
import StyleGuideLayout from './routes/StyleGuideLayout';
import AppLayout from './routes/AppLayout';
import Overview from './routes/Overview';
import Surface from './routes/Surface';
import ButtonRoute from './routes/Button';
import InputRoute from './routes/Input';
import FeedbackRoute from './routes/Feedback';
import OverlayRoute from './routes/Overlay';
import TokensRoute from './routes/Tokens';
import ReviewRoute from './routes/Review';
import ManageRoute from './routes/Manage';

export default function App() {
  return (
    <Routes>
      {/* 业务页面:AppLayout */}
      <Route element={<AppLayout />}>
        <Route index element={<ReviewRoute />} />
        <Route path="/manage" element={<ManageRoute />} />
        <Route path="/settings" element={<div className="text-text-2">设置 — 待实现</div>} />
      </Route>

      {/* 设计语言:StyleGuideLayout */}
      <Route path="/style-guide" element={<StyleGuideLayout />}>
        <Route index element={<Overview />} />
        <Route path="surface" element={<Surface />} />
        <Route path="button" element={<ButtonRoute />} />
        <Route path="input" element={<InputRoute />} />
        <Route path="feedback" element={<FeedbackRoute />} />
        <Route path="overlay" element={<OverlayRoute />} />
        <Route path="tokens" element={<TokensRoute />} />
      </Route>

      {/* 旧样式路径重定向 */}
      <Route path="/surface" element={<Navigate to="/style-guide/surface" replace />} />
      <Route path="/button" element={<Navigate to="/style-guide/button" replace />} />
      <Route path="/input" element={<Navigate to="/style-guide/input" replace />} />
      <Route path="/feedback" element={<Navigate to="/style-guide/feedback" replace />} />
      <Route path="/overlay" element={<Navigate to="/style-guide/overlay" replace />} />
      <Route path="/tokens" element={<Navigate to="/style-guide/tokens" replace />} />
      <Route path="/review" element={<Navigate to="/" replace />} />
    </Routes>
  );
}