using CommunityToolkit.Mvvm.ComponentModel;
using MedicalApp.Services;
using MedicalApp.ViewModels;
using System.Collections.ObjectModel;
using System.IO;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;


namespace MedicalApp.Views
{
    public partial class ProcessResearchWindow : Window
    {
        private readonly ProcessResearchViewModel _vm;

        public ProcessResearchWindow(ResearchDisplayModel file, string patientName,
            List<CaseDisplayModel> cases, int medicalRecordId)
        {
            InitializeComponent();
            _vm = new ProcessResearchViewModel(file, patientName, cases, medicalRecordId);
            DataContext = _vm;
            Loaded += OnLoaded;
        }

        private async void OnLoaded(object sender, RoutedEventArgs e)
        {
            // Ініціалізуємо WebView2
            await PdfViewer.EnsureCoreWebView2Async();

            // Будуємо абсолютний шлях до PDF
            var relativePath = _vm.FilePath?.Replace('\\', '/') ?? string.Empty;
            var basePath = AppDomain.CurrentDomain.BaseDirectory;

            var projectRoot = Path.GetFullPath(Path.Combine(basePath, @"..\..\..\..\.."));
            var backendRoot = Path.GetFullPath(Path.Combine(projectRoot, "..", "backend"));
            var fullPath = Path.GetFullPath(Path.Combine(backendRoot, relativePath));

            if (File.Exists(fullPath))
            {
                PdfViewer.Source = new Uri(fullPath);
            }
            else
            {
                // Якщо файл не знайдено — показуємо повідомлення
                PdfViewer.NavigateToString($@"
                    <html><body style='font-family:sans-serif;color:#888;display:flex;
                        align-items:center;justify-content:center;height:100vh;margin:0;
                        background:#525659;'>
                        <div style='text-align:center'>
                            <div style='font-size:48px'>📄</div>
                            <div style='color:#ccc;margin-top:12px'>Файл не знайдено</div>
                            <div style='color:#999;font-size:12px;margin-top:6px'>{fullPath}</div>
                        </div>
                    </body></html>");
            }

            
        }

        private void PdfViewer_NavigationStarting(object sender,
            Microsoft.Web.WebView2.Core.CoreWebView2NavigationStartingEventArgs e)
        {
            // Дозволяємо навігацію тільки до локальних файлів
        }

        private void CancelButton_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = false;
            Close();
        }

        private async void SaveButton_Click(object sender, RoutedEventArgs e)
        {
            var success = await _vm.SaveAsync();
            if (success)
            {
                DialogResult = true;
                Close();
            }
        }

        private void ClassifyButton_Click(object sender, RoutedEventArgs e)
        {
            _ = _vm.ClassifyAsync();
        }
        private void ToggleCandidates_Click2(object sender, RoutedEventArgs e)
        {
            _vm.IsCandidatesExpanded = !_vm.IsCandidatesExpanded;
            
        }

        private void Candidate_Click(object sender, MouseButtonEventArgs e)
        {
            if (sender is Border border && border.DataContext is CandidateDisplayModel candidate)
            {
                _vm.SelectedCandidate = candidate;
                
            }
        }
    }

    
}