import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

interface Message {
  title: string;
  date: string;
  state: string;
}

@Component({
  templateUrl: './list-message.component.html',
  styleUrls: ['./list-message.component.scss'],
})
export class ListMessageComponent implements OnInit {
  /**
   * Messages mock data
   */
  messages: Message[] = [
    {
      title: 'development of Food',
      date: '9/3/2008',
      state: 'Draft', // This value is just for example, the real value should be depending on the data from backend.
    },
    {
      title: 'development of Food',
      date: '9/3/2008',
      state: 'Draft', // This value is just for example, the real value should be depending on the data from backend.
    },
    {
      title: 'development of Food',
      date: '9/3/2008',
      state: 'Draft', // This value is just for example, the real value should be depending on the data from backend.
    },
    {
      title: 'development of Food',
      date: '9/3/2008',
      state: 'Draft', // This value is just for example, the real value should be depending on the data from backend.
    },
  ];

  selectabe: boolean;
  state: string; // This props is just for example and should be deleted when implementing a fetch request to backend.

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.selectabe = this.route.snapshot.queryParams.select || false;

    /**
     * These lines are just for dynamic state example and should be deleted when implementing a fetch request to backend.
     */
    this.state = this.route.snapshot.queryParams.state;
    //=====================================================================
  }
}
