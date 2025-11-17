import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonBackButton, IonItem, IonLabel, IonIcon, IonAccordionGroup,
  IonAccordion, IonCard, IonCardContent, IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { helpCircle, chatbubbles, mail } from 'ionicons/icons';

@Component({
  selector: 'app-help',
  templateUrl: './help.page.html',
  styleUrls: ['./help.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
    IonBackButton, IonItem, IonLabel, IonIcon, IonAccordionGroup,
    IonAccordion, IonCard, IonCardContent, IonButton
  ]
})
export class HelpPage {
  faqItems = [
    {
      question: 'Como criar uma nova receita?',
      answer: 'Para criar uma nova receita, vá até a tela de Receitas e clique no botão "+" no canto inferior direito. Preencha os campos obrigatórios e clique em "Salvar".'
    },
    {
      question: 'Como editar ou excluir uma receita?',
      answer: 'Na lista de receitas, clique sobre a receita que deseja editar. Na tela de detalhes, você encontrará os botões para editar ou excluir a receita.'
    },
    {
      question: 'Como criar uma nova despesa?',
      answer: 'Acesse a tela de Despesas e clique no botão "+" no canto inferior direito. Preencha as informações da despesa e salve.'
    },
    {
      question: 'Como visualizar o resumo financeiro?',
      answer: 'O resumo financeiro está disponível no Dashboard principal. Lá você pode ver receitas, despesas e saldo do mês.'
    },
    {
      question: 'Como alterar minha senha?',
      answer: 'Vá em Configurações > Segurança e escolha a opção "Alterar Senha". Digite sua senha atual e a nova senha.'
    },
    {
      question: 'Como ativar/desativar notificações?',
      answer: 'Em Configurações > Notificações, você pode ativar ou desativar notificações push e por email conforme sua preferência.'
    },
    {
      question: 'Como alterar o tema do aplicativo?',
      answer: 'Acesse Configurações > Aparência > Tema e escolha entre os temas Claro, Escuro ou Automático.'
    },
    {
      question: 'Como recuperar minha senha?',
      answer: 'Na tela de login, clique em "Esqueceu a senha?" e siga as instruções enviadas para seu email.'
    }
  ];

  constructor() {
    addIcons({ helpCircle, chatbubbles, mail });
  }

  sendEmail() {
    window.location.href = 'mailto:suporte@meuapp.com?subject=Suporte MeuApp';
  }
}
