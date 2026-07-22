pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = 'cinema-booking'
    }

    stages {
        stage('Checkout') {
            steps {
                // Clone repo private menggunakan credential github-pat (username/password)
                git branch: 'Jenkis',
                    url: 'https://github.com/RefaMuhammad/cinema-booking.git',
                    credentialsId: 'github-pat'
            }
        }

        stage('Build Images') {
            steps {
                echo 'Building Docker images...'
                bat 'docker compose build --no-cache'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying application...'
                // Stop container lama, lalu jalankan yang baru
                bat 'docker compose down'
                bat 'docker compose up -d'
            }
        }

        stage('Cleanup') {
            steps {
                echo 'Cleaning up dangling images...'
                bat 'docker image prune -f'
            }
        }
    }

    post {
        success {
            echo 'Pipeline berhasil! Aplikasi sudah running.'
            echo 'Frontend : http://localhost'
            echo 'Backend  : http://localhost:5000'
        }
        failure {
            echo 'Pipeline gagal! Cek log di atas untuk detail error.'
        }
        always {
            // Bersihkan workspace Jenkins
            cleanWs()
        }
    }
}
