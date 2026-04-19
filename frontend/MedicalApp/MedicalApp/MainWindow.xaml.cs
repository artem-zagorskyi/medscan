using System.Windows;
using System.Windows.Controls;
using MedicalApp.Helpers;
using MedicalApp.Services;
using MedicalApp.Views;

namespace MedicalApp;

public partial class MainWindow : Window
{
    private readonly AuthService _authService = new();

    public MainWindow()
    {
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        // TEMP: пропускаем авторизацию для разработки UI
        SessionManager.SetDoctorInfo("Іванов Олексій", "Терапевт");
        ShowApp("Іванов Олексій", "Терапевт", "USER");
        return;

        if (TokenStorage.IsValid())
        {
            try
            {
                var me = await _authService.GetMeAsync();
                if (me != null)
                {
                    SessionManager.Set(me.Id, me.PersonId, me.Email, me.Rights, me.Role);

                    // TODO: отдельный запрос GET /api/doctors/person/:personId
                    // для получения fullName и specialization
                    // SessionManager.SetDoctorInfo(doctor.FullName, doctor.Specialization);

                    ShowApp(me.Email, "Лікар", me.Rights);
                    return;
                }
            }
            catch
            {
                TokenStorage.Clear();
            }
        }

        ShowLogin();
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
        // TODO: NavigateTo(new SettingsView());
    }

    private void Help_Click(object sender, RoutedEventArgs e)
    {
        UserMenuPopup.IsOpen = false;
        // TODO: NavigateTo(new HelpView());
    }

    private void Logout_Click(object sender, RoutedEventArgs e)
    {
        UserMenuPopup.IsOpen = false;
        TokenStorage.Clear();
        SessionManager.Clear();
        ShowLogin();
    }
}