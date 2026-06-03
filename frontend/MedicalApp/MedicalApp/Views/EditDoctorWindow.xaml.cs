using System.Windows;
using MedicalApp.ViewModels;

namespace MedicalApp.Views;

public partial class EditDoctorWindow : Window
{
    public EditDoctorWindow(DoctorDisplayModel doctor)
    {
        InitializeComponent();
        var vm = new EditDoctorViewModel(doctor);
        vm.OnSaved = () =>
        {
            DialogResult = true;
            Close();
        };
        DataContext = vm;
    }

    private void CancelButton_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
        Close();
    }
}