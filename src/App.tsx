import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '@/components/Layout/AppLayout'
import Dashboard from '@/pages/Dashboard'
import Injury from '@/pages/Injury'
import Plan from '@/pages/Plan'
import CheckIn from '@/pages/CheckIn'
import Trend from '@/pages/Trend'
import Assessment from '@/pages/Assessment'
import Therapist from '@/pages/Therapist'
import Membership from '@/pages/Membership'
import Admin from '@/pages/Admin'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="injury" element={<Injury />} />
          <Route path="plan" element={<Plan />} />
          <Route path="checkin" element={<CheckIn />} />
          <Route path="trend" element={<Trend />} />
          <Route path="assessment" element={<Assessment />} />
          <Route path="therapist" element={<Therapist />} />
          <Route path="membership" element={<Membership />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </Router>
  )
}
