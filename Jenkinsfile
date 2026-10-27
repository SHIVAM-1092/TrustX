pipeline {
    agent any
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Build') {
            steps {
                sh 'javac Assignment.java'
            }
        }
        stage('Test') {
            steps {
                sh 'java Assignment'
            }
        }
    }
}
