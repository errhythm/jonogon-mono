'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {RxCaretSort, RxCheck} from 'react-icons/rx';
import {useState, PropsWithChildren} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {cn} from '@/lib/utils';
import PetitionList from '@/app/_components/PetitionList';
import PetitionActionButton from '@/components/custom/PetitionActionButton';
import {
    getDabiType,
    getDefaultSortForDabiType,
    getDefaultSortLabelForDabiType,
    getSortType,
} from './_components/petitionSortUtils';
import {TypeAnimation} from 'react-type-animation';
import {trpc} from '@/trpc/client';
import SearchBox from '@/components/custom/SearchBox';
import PetitionCard from '@/app/_components/PetitionCard';

function SortOption({
    sort,
    children,
}: PropsWithChildren<{sort: 'time' | 'votes'}>) {
    const router = useRouter();
    const params = useSearchParams();

    const selectedType = getDabiType(params.get('type'));
    const selectedSort = getSortType(params.get('sort'));

    const updateParams = () => {
        const nextSearchParams = new URLSearchParams(params);
        nextSearchParams.set('sort', sort);

        router.replace('/?' + nextSearchParams.toString());
    };

    return (
        <DropdownMenuItem
            className="capitalize flex items-center justify-between"
            onSelect={updateParams}>
            <span>{children}</span>
            {getDefaultSortForDabiType(selectedSort, selectedType) === sort ? (
                <RxCheck />
            ) : null}
        </DropdownMenuItem>
    );
}

function Tab({
    type,
    children,
}: PropsWithChildren<{type: 'request' | 'formalized'}>) {
    const router = useRouter();
    const params = useSearchParams();

    const updateParams = () => {
        const nextSearchParams = new URLSearchParams(params);
        const clickedSameType = nextSearchParams.get('type') === null || nextSearchParams.get('type') === type;
        nextSearchParams.set('type', type);
        if (!clickedSameType) {
            nextSearchParams.delete('page');
        }
        router.replace('/?' + nextSearchParams.toString());
    };

    return (
        <button
            className={cn(
                'border-b-2 border-transparent px-3 pb-1 capitalize select-none',
                {
                    'border-red-500 text-red-500':
                        getDabiType(params.get('type')) === type,
                },
            )}
            onClick={updateParams}>
            {children}
        </button>
    );
}

const DISCORD_COMMUNITY_SIZE = 2500;

export default function Home() {
    const params = useSearchParams();
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const type = getDabiType(params.get('type'));
    const sort = getDefaultSortForDabiType(
        getSortType(params.get('sort')),
        type,
    );

    const sortLabel = getDefaultSortLabelForDabiType(sort, type);

    const {data: userCountResponse} =
        trpc.users.getTotalNumberOfUsers.useQuery();

    const defaultTypeSeq = [
        'Submit.',
        500,
        'Submit. Vote.',
        500,
        'Submit. Vote.\nReform.',
        2000,
        `যত বেশি ভোট,\nতত তাড়াতাড়ি জবাব`,
        2000,
    ];

    const userCount = Number(userCountResponse?.data.count?.count ?? 0);

    const typeSeq =
        userCount > 0
            ? [
                ...defaultTypeSeq,
                `${userCount + DISCORD_COMMUNITY_SIZE} নাগরিক এর সাথে\nগড়ে তুলুন নতুন দেশ`,
                2000,
            ]
            : defaultTypeSeq;

    return (
        <>
            <div className="flex flex-col gap-4 max-w-screen-sm mx-auto pb-16 px-4">
                <h1 className="mt-12 my-5 text-3xl md:text-4xl font-bold text-red-500 min-h-20">
                    {type === 'own' ? (
                        'Your Own দাবিs'
                    ) : (
                        <TypeAnimation
                            key={userCount > 0 ? 'tomato' : 'potato'}
                            style={{whiteSpace: 'pre-line', display: 'inline'}}
                            cursor={true}
                            speed={80}
                            sequence={typeSeq}
                            omitDeletionAnimation
                            repeat={Infinity}
                        />
                    )}
                </h1>
                <SearchBox setSearchResults={setSearchResults} />
                <div className="flex items-center justify-between my-2">
                    {type === 'own' ? null : (
                        <div>
                            <Tab type={'request'}>সব দাবি</Tab>
                            <Tab type={'formalized'}>Formalized দাবিs</Tab>
                        </div>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <div className="flex items-center gap-2 pb-1">
                                <span className="capitalize text-sm select-none">
                                    {sortLabel}
                                </span>
                                <RxCaretSort />
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <SortOption sort={'votes'}>বেশি Votes</SortOption>
                            <SortOption sort={'time'}>Latest</SortOption>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                {searchResults.length > 0 ? (
                    <div className="flex flex-col gap-4">
                        {searchResults.map((petition) => (
                            <PetitionCard
                                key={petition.id}
                                id={petition.id}
                                userVote={petition.extras?.user_vote}
                                mode={type}
                                name={petition.extras?.user?.name ?? ''}
                                title={petition.title ?? 'Untitled Petition'}
                                date={new Date(petition.created_at ?? '1970-01-01')}
                                target={petition.target ?? 'Some Ministry'}
                                upvotes={Number(petition.petition_upvote_count) ?? 0}
                                downvotes={0} // We don't have this information from the search query
                                comments={0} // We don't have this information from the search query
                                upvoteTarget={0} // We don't have this information from the search query
                            />
                        ))}
                    </div>
                ) : (
                    <PetitionList />
                )}
            </div>
            <div className="fixed bottom-0 left-0 w-full bg-background/50">
                <div
                    className={
                        'max-w-screen-sm w-full mx-auto flex flex-col py-4 px-8'
                    }>
                    <PetitionActionButton />
                </div>
            </div>
        </>
    );
}
