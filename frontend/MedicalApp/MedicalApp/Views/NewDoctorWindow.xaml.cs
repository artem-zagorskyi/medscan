using System.Windows;
using System.Windows.Controls;
using MedicalApp.ViewModels;

namespace MedicalApp.Views;

public partial class NewDoctorWindow : Window
{
    private readonly NewDoctorViewModel _vm;

    public NewDoctorWindow()
    {
        InitializeComponent();
        _vm = new NewDoctorViewModel();
        _vm.OnSaved = () =>
        {
            DialogResult = true;
            Close();
        };
        DataContext = _vm;

        // Дефолтна стать
        GenderComboBox_Init();
    }

    private void GenderComboBox_Init()
    {
        // ComboBox буде ініціалізований через SelectionChanged
    }

    private void Gender_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (sender is ComboBox cb && _vm != null)
            _vm.SelectedGender = cb.SelectedIndex == 0 ? "MALE" : "FEMALE";
    }

    private void PasswordBox_PasswordChanged(object sender, RoutedEventArgs e)
    {
        if (sender is Wpf.Ui.Controls.PasswordBox pb)
            _vm.Password = pb.Password;
    }

    private void CancelButton_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
        Close();
    }
}