using System.Windows;
using System.Windows.Controls;
using MedicalApp.Helpers;
using MedicalApp.Services;
using MedicalApp.Views;

namespace MedicalApp;

public partial class MainWindow : Window
{
    private readonly AuthService _authService = new();
    private readonly DoctorService _doctorService = new();

    public MainWindow()
    {
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        try
        {
            if (TokenStorage.IsValid())
            {
                var me = await _authService.GetMeAsync();
                if (me != null)
                {
                    SessionManager.Set(me.Id, me.PersonId, me.Email, me.Rights, me.Role);

                    // Завантажуємо дані доктора по person_id
                    var doctor = await _doctorService.GetByPersonIdAsync(me.PersonId);
                    if (doctor != null)
                    {
                        var fullName = doctor.Person?.FullName ?? me.Email;
                        SessionManager.SetDoctorInfo(fullName, doctor.Specialization);
                        SessionManager.SetDoctorId(doctor.Id);
                        ShowApp(fullName, doctor.Specialization, me.Rights);
                        return;
                    }
                }
            }

            ShowLogin();
        }
        catch
        {
            TokenStorage.Clear();
            ShowLogin();
        }
    }

    public void ShowLogin()
    {
        Topbar.Visibility = Visibility.Collapsed;
        NavigateTo(new LoginView());
    }

    public void ShowApp(string name, string specialization, string rights)
    {
        Topbar.Visibility = Visibility.Visible;
        SetUser(name, specialization);

        if (rights == "ADMIN")
            NavigateTo(new AdminHomeView());
        else
            NavigateTo(new PatientListView());
    }

    public void NavigateTo(UserControl view)
    {
        MainContent.Content = view;
    }

    public void SetUser(string name, string specialization)
    {
        UserName.Text = name;
        UserSpecialization.Text = specialization;
        DropdownUserName.Text = name;
        DropdownSpecialization.Text = specialization;
    }

    private void UserMenuButton_Click(object sender, RoutedEventArgs e)
    {
        UserMenuPopup.IsOpen = !UserMenuPopup.IsOpen;
    }

    private void Settings_Click(object sender, RoutedEventArgs e)
    {
        UserMenuPopup.IsOpen = false;
    }

    private void Help_Click(object sender, RoutedEventArgs e)
    {
        UserMenuPopup.IsOpen = false;
    }

    private void Logout_Click(object sender, RoutedEventArgs e)
    {
        UserMenuPopup.IsOpen = false;
        TokenStorage.Clear();
        SessionManager.Clear();
        ShowLogin();
    }
}