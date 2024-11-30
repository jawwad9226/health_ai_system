interface ExportData {
  healthData: any;
  predictions: any;
  recommendations: any[];
  history: any[];
}

export const exportDashboardData = async (data: ExportData): Promise<void> => {
  try {
    const exportData = {
      exportDate: new Date().toISOString(),
      data: {
        currentHealth: data.healthData,
        predictions: data.predictions,
        recommendations: data.recommendations,
        healthHistory: data.history,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `health-dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
    
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting dashboard data:', error);
    throw new Error('Failed to export dashboard data');
  }
};
