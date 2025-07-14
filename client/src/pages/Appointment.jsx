import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebase.ts';
import { ref, update, get } from 'firebase/database';
import { format } from 'date-fns';
import QRCode from 'react-qr-code';
import QRCodeLib from 'qrcode'; 
// import axios from 'axios';
// import emailjs from 'emailjs-com';
import html2canvas from 'html2canvas';


const Appointment = () => {
  const [userData, setUserData] = useState(null);
  // const [previousVisits, setPreviousVisits] = useState([]);
  const [formData, setFormData] = useState({
    department: '',
    description: '',
    email: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    qr_code: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ message: '', type: '' });
  
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId; 
  const [appointmentId, setAppointmentId] = useState('');
   const qrCodeRef = useRef(null)

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        navigate('/');
        return;
      }

      try {
        const userRef = ref(db, `clients/${userId}`);
        const snapshot = await get(userRef);
        
        if (!snapshot.exists()) {
          setStatus({ message: 'User not found', type: 'error' });
          setTimeout(() => navigate('/'), 2000);
          return;
        }

        const data = snapshot.val();
        setUserData(data);
        
        // Load previous visits if they exist
        if (data.appointments) {
          // const visits = Object.entries(data.appointments)
          //   .map(([id, visit]) => ({ id, ...visit }))
          //   .sort((a, b) => new Date(b.date) - new Date(a.date));
          // setPreviousVisits(visits);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setStatus({ message: 'Failed to load user data', type: 'error' });
      }
    };

    fetchUserData();
  }, [userId, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  // console.log("Using API key:", process.env.REACT_APP_SMTP2GO_API_KEY);

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    const newAppointmentId = `appt-${Date.now()}`;
    setAppointmentId(newAppointmentId);

    // 1. Generate QR Code as Base64 (SVG)
    // const svg = qrCodeRef.current.querySelector('svg');
    // const svgData = new XMLSerializer().serializeToString(svg);
    const qrCodeDataUrl = await QRCodeLib.toDataURL(newAppointmentId);

    
    // 2. Convert QR Code to PNG
    const canvas = await html2canvas(qrCodeRef.current);
    const pngDataUrl = canvas.toDataURL('image/png');

    // 3. Save to Firebase (after QR is generated)
    const appointmentData = {
      ...formData,
      id: newAppointmentId,
      createdAt: new Date().toISOString(),
      status: 'scheduled',
      qr_code: qrCodeDataUrl,
    };

    await update(ref(db, `clients/${userId}/appointments/${newAppointmentId}`), appointmentData);

    // 4. Send email via your backend
    const res = await fetch('http://localhost:3001/send-appointment-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toEmail: formData.email,
        toName: userData.name,
        department: formData.department,
        date: formData.date,
        time: formData.time,
        appointmentId: newAppointmentId,
        qrBase64: pngDataUrl,
      }),
    });

    if (!res.ok) throw new Error('Email sending failed');

    setStatus({ 
      message: 'Appointment scheduled! Confirmation email sent.', 
      type: 'success' 
    });

    // 5. Reset Form
    setFormData({
      department: '',
      description: '',
      email: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      qr_code: ''
    });

  } catch (error) {
    console.error("Submit error:", error);

    setStatus({ 
      message: 'Appointment saved but email sending failed.', 
      type: 'warning' 
    });
  } finally {
    setIsSubmitting(false);
  }
};


  const handleNavigate = useCallback(() => {
    navigate('/appointment-history', { 
      state: { 
        userId: userId,
        userName: userData.name || 'User'
      } 
    });
  }, [userData, navigate]);

  if (!userData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Welcome, {userData.name}</h1>
        <div className='space-x-2'>
                  <button
                  onClick={() => navigate('/')}
                  className="bg-blue-500 hover:underline rounded-lg text-white px-4 py-2 mb-6 "
                >
                 Home
                </button>

                <button
                  onClick={handleNavigate}
                  className="bg-blue-500 hover:underline rounded-lg text-white px-4 py-2 mb-6"
                >
                  Appointment History
                </button>
        </div>

        <div className="">
          <div>
            <h2 className="text-xl font-semibold mb-4">Schedule New Appointment</h2>

            {appointmentId && (
              <div className="my-4 text-center">
                <p className="text-sm font-medium text-gray-700">Appointment ID: <span className="font-bold">{appointmentId}</span></p>
                <div ref={qrCodeRef} className="mt-2 inline-block p-2 bg-white rounded shadow">
                  <QRCode value={formData.qr_code || appointmentId} size={128} />
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Department</option>
                  <option value="Sales">Sales</option>
                  <option value="Support">Support</option>
                  <option value="Billing">Billing</option>
                  <option value="Technical">Technical</option>
                  <option value="HR">Human Resources</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your Email"
                ></input>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Briefly describe the purpose of your visit"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-2 px-4 rounded-lg font-medium text-white
                  ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}
                `}
              >
                {isSubmitting ? 'Scheduling...' : 'Schedule Appointment'}
              </button>
            </form>

            {status.message && (
              <div className={`mt-4  p-3 rounded-lg text-center
                ${status.type === 'error' ? 'bg-red-100 text-red-700' :
                  status.type === 'success' ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'}
              `}>
                {status.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appointment;