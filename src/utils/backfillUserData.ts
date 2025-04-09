
export const backfillAppointmentData = () => {
  const today = new Date();
  const appointments = [];
  
  // Add past appointments
  for (let i = 1; i <= 5; i++) {
    const date = new Date();
    date.setDate(today.getDate() - i * 2);
    
    // Convert to ISO string for the timestamp
    const startTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9 + i, 0).toISOString();
    const endTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10 + i, 0).toISOString();
    
    appointments.push({
      title: `Past Session ${i}`,
      start_time: startTime,
      end_time: endTime,
      status: 'Completed'
    });
  }
  
  // Add future appointments
  for (let i = 1; i <= 5; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i * 3);
    
    const startTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10 + i, 0).toISOString();
    const endTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 11 + i, 0).toISOString();
    
    appointments.push({
      title: `Upcoming Session ${i}`,
      start_time: startTime,
      end_time: endTime,
      status: 'Scheduled'
    });
  }
  
  return appointments;
};

export const backfillNoteData = () => {
  const notes = [];
  const today = new Date();
  
  for (let i = 1; i <= 10; i++) {
    const date = new Date();
    date.setDate(today.getDate() - i * 3);
    
    notes.push({
      content: `<p>Session notes for session ${i}. The client reported making progress with their anxiety management techniques.</p><p>We discussed several strategies for handling stress in workplace situations.</p><p>Client has been practicing mindfulness exercises daily and reports improved sleep patterns.</p>`,
      is_private: true,
      created_at: date.toISOString(),
      updated_at: date.toISOString()
    });
  }
  
  return notes;
};
