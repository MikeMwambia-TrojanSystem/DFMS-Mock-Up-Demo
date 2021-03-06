import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import _ from 'lodash-es';
import { switchMap, take } from 'rxjs/operators';
import { CacheService } from 'src/app/services/cache.service';
import { MotionService } from 'src/app/services/motion.service';
import { NoticeOfMotionService } from 'src/app/services/notice-of-motion.service';

import { Motion } from 'src/app/shared/types/motion';

@Component({
  styleUrls: ['./list-notice.component.scss'],
  templateUrl: './list-notice.component.html',
})
export class ListNoticeOfMotionComponent implements OnInit {
  private _cacheId: string;
  private _state: 'draft' | 'private' | 'public';
  private _noticeOfMotions: Motion[];
  noticeOfMotions: Motion[];
  selectable: boolean;

  constructor(
    private route: ActivatedRoute,
    private cacheService: CacheService,
    private router: Router,
    private motionService: MotionService,
    private noticeOfMotionsService: NoticeOfMotionService
  ) {}

  ngOnInit(): void {
    // Get selectable state, cache emit id, state from query url
    const queryParams = this.route.snapshot.queryParams;
    this.selectable = queryParams.select === 'true' || false;
    this._cacheId = queryParams.id;
    this._state = queryParams.state;

    // Get Motions data from resolver
    this.route.data
      .pipe(take(1))
      .subscribe(({ notices }: { notices: Motion[] }) => {
        const ordered = _.orderBy(notices, 'createdAt', 'desc');
        this._noticeOfMotions = ordered;
        this.noticeOfMotions = ordered;
      });
  }

  // onDelete(id: string) {
  //   this.noticeOfMotionService.deleteMotion(id).subscribe(() => {
  //     window.location.reload(); // Reload page when successfully deleting motion
  //   });
  // }

  onCreateNew() {
    this.cacheService.cache(
      'LIST_NEW_MOTION',
      null,
      this.router.createUrlTree(['/list/motion'], {
        queryParams: {
          select: this.selectable,
          id: this._cacheId,
          state: this._state,
        },
      }),
      () => {
        return null;
      }
    );

    this.router.navigate(['/generate/notice-of-motion'], {
      queryParams: {
        id: 'LIST_NEW_MOTION',
      },
    });
  }

  onSelect(motion: Motion) {
    this.cacheService.emit(this._cacheId, motion);
  }

  onDelete(id: string) {
    this.motionService.deleteMotion(id).subscribe(() => {
      window.location.reload(); // Reload page when successfully deleting motion
    });
  }

  onApprove({ _id }: Motion) {
    this.noticeOfMotionsService.approveNotice(_id).subscribe(() => {
      window.location.reload();
    });
  }

  onSearch(query: string) {
    this.noticeOfMotions = this._noticeOfMotions.filter((i) =>
      _.lowerCase(i.title).includes(_.lowerCase(query))
    );
  }
}
