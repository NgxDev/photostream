import { Component } from '@angular/core';
import { MatTabNavPanel } from '@angular/material/tabs';
import { RouterOutlet } from '@angular/router';
import { Header } from './header/header';

@Component({
  selector: 'ps-root',
  imports: [Header, MatTabNavPanel, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
