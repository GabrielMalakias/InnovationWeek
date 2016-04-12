ActiveAdmin.register Doodle::Protocol, as: "Conversation"  do
  actions :index, :show
  menu parent: 'Chat'

  index do
    id_column
    column :customer_login
    column :phone
    column :status
    column :created_at
    column :updated_at
    column :in_progress_at
    column :finalized_at
    column :duration
    actions
  end

  show do
    attributes_table do
      row :customer_login
      row :phone
      row :status
      row :created_at
      row :updated_at
      row :in_progress_at
      row :finalized_at
      row :duration
      row :user
      row :channel
      row :history do
        link_to(conversation.conversation, admin_doodle_history_path(conversation.conversation))
      end
    end
  end
end
