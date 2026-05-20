
// Function to generate random dates
const getRandomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Function to backfill user data for the demo
export const backfillUserData = async () => {
  try {
    console.log('Backfilling user data...');
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    
    const endDate = new Date();
    
    // Generate 10 sample appointments
    const sampleAppointments = Array.from({ length: 10 }, (_, i) => {
      const date = getRandomDate(startDate, endDate);
      return {
        id: `appointment-${i + 1}`,
        title: `Therapy Session ${i + 1}`,
        start_time: date.toISOString(),
        end_time: new Date(date.getTime() + 60 * 60 * 1000).toISOString(),
        status: i % 5 === 0 ? 'Cancelled' : 'Completed',
        notes: i % 2 === 0 ? 'Patient reported improved mood today.' : undefined
      };
    });
    
    console.log('Generated sample appointments:', sampleAppointments);
    
    return {
      success: true,
      appointments: sampleAppointments
    };
  } catch (error) {
    console.error('Error in backfillUserData:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Make sure the function is properly exported
export default backfillUserData;
