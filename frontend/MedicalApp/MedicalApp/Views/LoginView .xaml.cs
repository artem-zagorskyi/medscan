using System.Windows;
using System.Windows.Controls;
using MedicalApp.ViewModels;

namespace MedicalApp.Views;

public partial class LoginView : UserControl
{
    public LoginView()
    {
        InitializeComponent();
        PasswordBox.PasswordChanged += (s, e) =>
        {
            if (DataContext is LoginViewModel vm)
                vm.Password = PasswordBox.Password;
        };
    }

    /*private void PasswordBox_PasswordChanged(object sender, RoutedEventArgs e)
    {
        if (DataContext is LoginViewModel vm)
            vm.Password = PasswordBox.Password;
    }*/
}