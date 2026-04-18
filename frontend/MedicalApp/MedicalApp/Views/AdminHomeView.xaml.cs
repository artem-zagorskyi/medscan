using System.Windows;
using System.Windows.Controls;
using MedicalApp.Helpers;

namespace MedicalApp.Views
{
    public partial class AdminHomeView : UserControl
    {
        public AdminHomeView()
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
