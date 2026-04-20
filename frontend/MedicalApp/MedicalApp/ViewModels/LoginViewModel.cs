using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MedicalApp.Helpers;
using MedicalApp.Services;
using System.Net.Http;

namespace MedicalApp.ViewModels;

public partial class LoginViewModel : ObservableObject
{
    private readonly AuthService _authService = new();
    private readonly DoctorService _doctorService = new();

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
                if (me != null)
                {
                    SessionManager.Set(me.Id, me.PersonId, me.Email, me.Rights, me.Role);

                    if (me.Rights == "ADMIN")
                    {
                        SessionManager.SetDoctorInfo(me.Email, "Адміністратор");
                        var mainWindow = (MainWindow)App.Current.MainWindow;
                        mainWindow.ShowApp(me.Email, "Адміністратор", me.Rights);
                        return;
                    }

                    var doctor = await _doctorService.GetByPersonIdAsync(me.PersonId);
                    if (doctor != null)
                    {
                        var fullName = doctor.Person?.FullName ?? me.Email;
                        SessionManager.SetDoctorInfo(fullName, doctor.Specialization);
                        SessionManager.SetDoctorId(doctor.Id);

                        var mainWindow = (MainWindow)App.Current.MainWindow;
                        mainWindow.ShowApp(fullName, doctor.Specialization, me.Rights);
                    }
                }
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