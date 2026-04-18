using System.Windows;
using System.Windows.Controls;
using MedicalApp.Helpers;

namespace MedicalApp.Views
{
    public partial class DoctorHomeView : UserControl
    {
        public DoctorHomeView()
        {
            InitializeComponent();
        }

        private void Logout_Click(object sender, RoutedEventArgs e)
        {
            TokenStorage.Clear();
            SessionManager.Clear();

            var mainWindow = (MainWindow)App.Current.MainWindow;
            mainWindow.ShowLogin();
        }
    }
}
