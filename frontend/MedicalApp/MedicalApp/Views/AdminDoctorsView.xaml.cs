using System.Windows;
using System.Windows.Controls;
using MedicalApp.ViewModels;

namespace MedicalApp.Views;

public partial class AdminDoctorsView : UserControl
{
    private readonly AdminDoctorsViewModel _vm;

    public AdminDoctorsView()
    {
        InitializeComponent();
        _vm = new AdminDoctorsViewModel();
        DataContext = _vm;
    }

    private void AddDoctor_Click(object sender, RoutedEventArgs e)
    {
        var window = new NewDoctorWindow();
        window.Owner = App.Current.MainWindow;
        if (window.ShowDialog() == true)
            _ = _vm.LoadAsync();
    }

    private void EditDoctor_Click(object sender, RoutedEventArgs e)
    {
        if (sender is Button btn && btn.Tag is DoctorDisplayModel doctor)
        {
            var window = new EditDoctorWindow(doctor);
            window.Owner = App.Current.MainWindow;
            if (window.ShowDialog() == true)
                _ = _vm.LoadAsync();
        }
    }

    private async void ToggleActive_Click(object sender, RoutedEventArgs e)
    {
        if (sender is Button btn && btn.Tag is DoctorDisplayModel doctor)
            await _vm.ToggleActiveAsync(doctor);
    }
}