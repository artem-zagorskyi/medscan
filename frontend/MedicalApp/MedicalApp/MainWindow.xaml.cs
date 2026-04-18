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
        if (TokenStorage.IsValid())
        {
            try
            {
                var me = await _authService.GetMeAsync();
                if (me != null)
                {
                    SessionManager.Set(
                        me.Id,
                        me.PersonId,
                        me.Email,
                        me.Rights,
                        me.Role
                    );

                    ShowApp(me.Email, me.Role, me.Rights);
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
        Sidebar.Visibility = Visibility.Collapsed;
        Grid.SetColumn(ContentArea, 0);
        Grid.SetColumnSpan(ContentArea, 2);
        SessionManager.Clear();
        NavigateTo(new LoginView());
    }

    public void ShowApp(string email, string role, string rights)
    {
        Sidebar.Visibility = Visibility.Visible;
        Grid.SetColumn(ContentArea, 1);
        Grid.SetColumnSpan(ContentArea, 1);
        SetUser(email, role);

        if (SessionManager.IsAdmin())
            NavigateTo(new AdminHomeView());
        else
            NavigateTo(new DoctorHomeView());
    }

    public void NavigateTo(UserControl view)
    {
        MainContent.Content = view;
    }

    public void SetUser(string name, string role)
    {
        UserName.Text = name;
        UserRole.Text = role;
        UserInitials.Text = name.Length >= 2 ? name[..2].ToUpper() : name.ToUpper();
    }

    private void NavPatients_Click(object sender, RoutedEventArgs e)
    {
        NavigateTo(new PatientListView());
    }
}