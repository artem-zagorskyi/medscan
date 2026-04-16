using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MedicalApp.Services;
using MedicalApp.Views;
using System.Net.Http;

namespace MedicalApp.ViewModels;

public partial class LoginViewModel : ObservableObject
{
    private readonly AuthService _authService = new();

    [ObservableProperty]
    private string _email = string.Empty;

    [ObservableProperty]
    private string _password = string.Empty;

    [ObservableProperty]
    private string _errorMessage = string.Empty;

    [ObservableProperty]
    private bool _isLoading = false;

    [RelayCommand]
    private async Task LoginAsync()
    {
        ErrorMessage = string.Empty;

        if (string.IsNullOrWhiteSpace(Email) || string.IsNullOrWhiteSpace(Password))
        {
            ErrorMessage = "Введіть email та пароль";
            return;
        }

        try
        {
            IsLoading = true;

            var result = await _authService.LoginAsync(Email, Password);

            if (result?.Token != null)
            {
                var me = await _authService.GetMeAsync();

                var mainWindow = (MainWindow)App.Current.MainWindow;
                mainWindow.ShowApp(me?.Email ?? "Лікар", me?.Role ?? "DOCTOR");
            }
        }
        catch (HttpRequestException)
        {
            ErrorMessage = "Невірний email або пароль";
        }
        catch (Exception)
        {
            ErrorMessage = "Помилка з'єднання з сервером";
        }
        finally
        {
            IsLoading = false;
        }
    }
}