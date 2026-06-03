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

                    if (me.Rights == "ADMIN")
                    {
                        SessionManager.SetDoctorInfo(me.Email, "Адміністратор");
                        ShowApp(me.Email, "Адміністратор", me.Rights);
                        return;
                    }

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
        Sidebar.Visibility = Visibility.Collapsed;
        SidebarColumn.Width = new GridLength(0);
        NavigateTo(new LoginView());
    }

    public void ShowApp(string name, string specialization, string rights)
    {
        if (rights == "ADMIN")
        {
            // Для адміна — сайдбар, без топбара
            Topbar.Visibility = Visibility.Collapsed;
            Sidebar.Visibility = Visibility.Visible;
            SidebarColumn.Width = new GridLength(260);
            AdminName.Text = name;
            NavigateTo(new AdminDoctorsView());
            SetActiveNav(NavDoctors);
        }
        else
        {
            // Для лікаря — топбар, без сайдбара
            Topbar.Visibility = Visibility.Visible;
            Sidebar.Visibility = Visibility.Collapsed;
            SidebarColumn.Width = new GridLength(0);
            SetUser(name, specialization);
            NavigateTo(new PatientListView());
        }
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

    // --- Навігація адміна ---
    private void NavDoctors_Click(object sender, RoutedEventArgs e)
    {
        NavigateTo(new AdminDoctorsView());
        SetActiveNav(NavDoctors);
    }

    private void NavPatients_Click(object sender, RoutedEventArgs e)
    {
        NavigateTo(new AdminPatientsView());
        SetActiveNav(NavPatients);
    }

    private void NavUploads_Click(object sender, RoutedEventArgs e)
    {
        NavigateTo(new AdminUploadsView());
        SetActiveNav(NavUploads);
    }

    private void SetActiveNav(Button active)
    {
        var navButtons = new[] { NavDoctors, NavPatients, NavUploads };
        foreach (var btn in navButtons)
        {
            var isActive = btn == active;
            btn.Background = isActive
                ? System.Windows.Media.Brushes.Transparent
                : System.Windows.Media.Brushes.Transparent;

            // Обновляем цвет иконки и текста через дочерние элементы
            UpdateNavButtonStyle(btn, isActive);
        }
    }

    private void UpdateNavButtonStyle(Button btn, bool isActive)
    {
        if (btn.Content is not StackPanel sp) return;

        foreach (var child in sp.Children)
        {
            if (child is Wpf.Ui.Controls.SymbolIcon icon)
                icon.Foreground = new System.Windows.Media.SolidColorBrush(
                    isActive ? System.Windows.Media.Colors.White
                             : (System.Windows.Media.Color)System.Windows.Media.ColorConverter
                                 .ConvertFromString("#B5D4F4"));

            if (child is TextBlock tb)
                tb.Foreground = new System.Windows.Media.SolidColorBrush(
                    System.Windows.Media.Colors.White);
        }

        btn.Background = isActive
            ? new System.Windows.Media.SolidColorBrush(
                (System.Windows.Media.Color)System.Windows.Media.ColorConverter
                    .ConvertFromString("#1A6FB8"))
            : System.Windows.Media.Brushes.Transparent;
    }

    // --- Загальні ---
    private void UserMenuButton_Click(object sender, RoutedEventArgs e)
        => UserMenuPopup.IsOpen = !UserMenuPopup.IsOpen;

    private void Settings_Click(object sender, RoutedEventArgs e)
        => UserMenuPopup.IsOpen = false;

    private void Help_Click(object sender, RoutedEventArgs e)
        => UserMenuPopup.IsOpen = false;

    private void Logout_Click(object sender, RoutedEventArgs e)
    {
        UserMenuPopup.IsOpen = false;
        TokenStorage.Clear();
        SessionManager.Clear();
        ShowLogin();
    }
}